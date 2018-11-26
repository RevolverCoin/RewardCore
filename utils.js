const {
    List,
    Range,
    Set,
} = require('immutable')

function getRandomInt(min, max) {
    min = Math.floor(min);
    max = Math.ceil(max);
    return min >= max ? max : Math.floor(Math.random() * (max - min)) + min;
}

function listAverage(list) {
    return list.reduce((acc, next) => acc + next, 0) / list.size
}


/**
 * returns @count uniformly distributed numbers that add to 1
 * @param count
 */
function randFixedSum(count) {
    const segments = Range(0, count).map(i => Math.random()).toList()
    const sum = segments.reduce((acc, next) => acc + next, 0);
    return segments.map(i => i / sum)
}

function createProbabilityTable(probs) {
    return probs.reduce((acc, next) => {
        return acc.push(acc.last() + next)
    }, List())
}

function createAdjacencyMatrix(edges) {
    return edges.reduce((acc, next) => {
        return acc.update(next.get('source'), List(), val => (val || List()).set(next.get('target'), 1));
    }, List())
}

function isTerminal(nodeId, matrix) {
    return !getAdjacentNodes(nodeId, matrix).size
}

function getAdjacentNodes(nodeId, matrix) {
    const rowNodes = matrix.get(nodeId) ? matrix.get(nodeId).reduce((acc, next, index) => next ? acc.push(index) : acc, List()) : List();
    const colNodes = matrix.reduce((acc, next, index) => next && next.get(nodeId) ? acc.push(index) : acc, List())
    return rowNodes.concat(colNodes)
}

/**
 * 
 * @param {*} nodeId 
 * @param {*} matrix 
 * @param {*} useDirection whether consider adjacency matrix as a directional 
 */
function getAdjacentNodesSet(nodeId, matrix, useDirection = false) {
    const rowNodes = matrix.get(nodeId) ? matrix.get(nodeId).reduce((acc, next, index) => next ? acc.add(index) : acc, Set()) : Set();
    //if we are in directional mode, only use indices that are directly set in adjacency matrix e.g. rows
    const colNodes = useDirection ? List () :  matrix.reduce((acc, next, index) => next && next.get(nodeId) ? acc.add(index) : acc, Set())
    return rowNodes.concat(colNodes)
}


function isSet(matrix, source, target) {
    return matrix.hasIn([source, target])
}

/**
 * unsets specified indexes in specified matrix
 * @param indices
 */
function unsetAdjacencyMatrixIndices(matrix, bidirectional, ...indices) {
    const safeDelete = (map, s, t) => map.hasIn([s, t]) ? map.setIn([s, t], undefined) : map
    return matrix.withMutations(mutable => {
        indices.forEach(idx => {
            safeDelete(mutable, idx.source, idx.target)
            bidirectional && safeDelete(mutable, idx.target, idx.source)
        })
    })
}

function unsetAdjacencyMatrixIndices2(matrix, bidirectional, ...indices) {
    const safeDelete = (map, s, t) => map.hasIn([s, t]) ? map.setIn([s, t], undefined) : map

    return indices.reduce((acc, idx) => {
        let res = safeDelete(acc, idx.source, idx.target)
        return bidirectional ? safeDelete(res, idx.target, idx.source) : res
    }, matrix);
}

module.exports = {
    getRandomInt,
    listAverage,
    randFixedSum,
    createProbabilityTable,
    createAdjacencyMatrix,
    isTerminal,
    getAdjacentNodes,
    getAdjacentNodesSet,
    isSet,
    unsetAdjacencyMatrixIndices
}