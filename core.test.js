const test = require('tape')
const {graph1} = require ('./data/data')
const {
    Map,
    fromJS,
} = require("immutable")

const {
    createGetNodeFeeFunc,
    distributeReward
} = require('./core')

test('distributeReward', (t) => {
    const initialState = graph1;
    const block = Map({finderId :0, subsidy : 10, blockReward: 10})
    const getNodeFee =createGetNodeFeeFunc(initialState.get('nodes'),0.1,0.5)
    const state = distributeReward({state:initialState, block, getNodeFee})
    const rewards = state.get('nodes').map(node=>fromJS({id:node.get('id'), reward : node.get('reward')}))

    t.deepEqual(rewards.toJS(), [
        {id:0,reward:1},
        {id:1,reward:0.075},
        {id:2,reward:0.118125},
        {id:3,reward:1.5},
        {id:4,reward:1.5},
        {id:5,reward:1.5},
        {id:6,reward:0.39375},
        {id:7,reward:0.39375},
        {id:8,reward:0.7875},
        {id:9,reward:0.075},
        {id:10,reward:0.15},
        {id:11,reward:0.05},
        {id:12,reward:0.05},
        {id:13,reward:0.05}
    ])

    t.end()
})

