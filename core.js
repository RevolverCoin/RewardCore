const {
    getAdjacentNodesSet: getAdjSet,
    createAdjacencyMatrix,
} = require("./utils");

const NodeType = require('./NodeType')

const {
    List,
    Set,
    Map
} = require("immutable")
const memoize = require('memoizee');
const getAdjacentNodesSet = memoize(getAdjSet, {
    profileName: 'getAdjacentNodesSet'
})
/**
 * breadth first search based traversal
 * @param {*} matrix adjacency matrix
 * @param {*} startNode id of starting node
 * @param {*} visitFn function to be called for each node with following params
 *  (nodeId, parents, parentChildren : map <nodeId, children> of prev nodes)
 */
function bfs(matrix, startNode, visitFn) {
    const listToExplore = [startNode];
    let visited = Set.of(startNode)
    let parentChildren = Map()

    do {
        const nodeIndex = listToExplore.shift();
        const nodeChildren = getAdjacentNodesSet(nodeIndex, matrix, nodeIndex === startNode).subtract(visited)
        //populate parent->children map to determine number of outputs for each parents later
        parentChildren = parentChildren.update(nodeIndex, n => n ? n : nodeChildren)
        parentChildren = nodeChildren.reduce((acc, next) => {
            return acc.update(next, r => r ? r : getAdjacentNodesSet(next, matrix).subtract(visited))
        }, parentChildren)

        nodeChildren.forEach(childId => {
            visited = visited.add(childId);
            listToExplore.push(childId)
            const adjacent = getAdjacentNodesSet(childId, matrix)
            visitFn(childId, adjacent.intersect(visited), parentChildren, nodeIndex)
        })
    }
    while (listToExplore.length > 0 && visited.size < matrix.size)
};



/**
 * BFS based distribution
 * @param {*} param0 
 */
function distributeReward({
    state,
    adjacencyMatrix,
    block,
    getNodeFee,
    rewardFinder = true
}) {
    const matrix = adjacencyMatrix || createAdjacencyMatrix(state.get("edges"));
    const subsidy = block.get("subsidy");
    const finder = block.get("finderId");
    //reward of each node
    let reward = Map().set(finder, rewardFinder ? subsidy * getNodeFee(finder) : 0);
    //total output reward for each node
    let outReward = Map().set(finder, rewardFinder ? subsidy * (1 - getNodeFee(finder)) : subsidy);
    //maps parent-child reward inflows
    //e.g parent_child key contains reward received by a child through specified parent
    let rewardPath = Map().set(`${finder}`,  rewardFinder ? subsidy * (getNodeFee(finder)) : 0)
    const mergeReward = (nodeId, parents, parentChildren, parentId) => {
        //node reward per each of it's parents
        const getRewardsPerParent = () => {
            return parents.reduce((acc, next) => {
                const children = parentChildren.get(next)
                const childrenCount = children && children.size || 1
                return acc.set(`${next}_${nodeId}`, outReward.get(next) / childrenCount)
            }, Map())
        }

        const rewardsPerParent = getRewardsPerParent()

        const fee = getNodeFee(nodeId, parentId)
        //cumulative node reward is a sum of rewards flowing through each parent
        const nodeReward = rewardsPerParent.reduce( (acc, next) => acc + next, 0)
        //update reward path with new values
        rewardPath = rewardPath.mergeWith((oldVal, newVal) => oldVal + newVal, rewardsPerParent.reduce( (acc, val, key) => acc.set(key, val *  fee ), Map()))
        //reward that belongs to node
        reward = reward.set(nodeId, nodeReward * fee)
        //out reward
        outReward = outReward.set(nodeId, nodeReward * (1 - fee))
    }


    bfs(matrix, finder, mergeReward)

    return state
        .set("rewardPerParent",rewardPath)
        .update("nodes", nodes => nodes.map(n => {
            const hasRewardUpdate = reward.has(n.get('id'));
            return hasRewardUpdate ? n.update("reward", 0, r => {
                const rounded = Math.round(100000000 * reward.get(n.get('id'))) / 100000000
                return r + rounded
            }) : n
        }));
}

/**
 * cleares an existing getAdjacentNode memoizee cache
 */
function clearAdjMatrixMemoizeCache() {
    getAdjacentNodesSet && getAdjacentNodesSet.clear && getAdjacentNodesSet.clear()
}

/**
 * returns function that returns node fee based on type
 * @param {*} nodes list of nodes
 */
function createGetNodeFeeFunc (nodes, supporterFee, authorFee) {
    const nodeMap = nodes.reduce((acc, next) => acc.set(next.get('id'), next.get('type')=== NodeType.AUTHOR ? authorFee : supporterFee), Map())
    return nodeId => nodeMap.get(nodeId)
}


module.exports = {
    distributeReward,
    createGetNodeFeeFunc,
    clearAdjMatrixMemoizeCache
}