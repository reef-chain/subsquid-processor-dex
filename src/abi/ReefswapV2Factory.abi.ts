export const ABI_JSON = [
    {
        "type": "constructor",
        "stateMutability": "undefined",
        "payable": false,
        "inputs": [
            {
                "type": "address",
                "name": "_feeToSetter"
            }
        ]
    },
    {
        "type": "event",
        "anonymous": false,
        "name": "PairCreated",
        "inputs": [
            {
                "type": "address",
                "name": "token0",
                "indexed": true
            },
            {
                "type": "address",
                "name": "token1",
                "indexed": true
            },
            {
                "type": "address",
                "name": "pair",
                "indexed": false
            },
            {
                "type": "uint256",
                "name": "",
                "indexed": false
            }
        ]
    },
    {
        "type": "function",
        "name": "allPairs",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [
            {
                "type": "uint256",
                "name": ""
            }
        ],
        "outputs": [
            {
                "type": "address",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "allPairsLength",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "uint256",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "createPair",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "address",
                "name": "tokenA"
            },
            {
                "type": "address",
                "name": "tokenB"
            }
        ],
        "outputs": [
            {
                "type": "address",
                "name": "pair"
            }
        ]
    },
    {
        "type": "function",
        "name": "feeTo",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "address",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "feeToSetter",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [],
        "outputs": [
            {
                "type": "address",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "getPair",
        "constant": true,
        "stateMutability": "view",
        "payable": false,
        "inputs": [
            {
                "type": "address",
                "name": ""
            },
            {
                "type": "address",
                "name": ""
            }
        ],
        "outputs": [
            {
                "type": "address",
                "name": ""
            }
        ]
    },
    {
        "type": "function",
        "name": "setFeeTo",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "address",
                "name": "_feeTo"
            }
        ],
        "outputs": []
    },
    {
        "type": "function",
        "name": "setFeeToSetter",
        "constant": false,
        "payable": false,
        "inputs": [
            {
                "type": "address",
                "name": "_feeToSetter"
            }
        ],
        "outputs": []
    }
]
