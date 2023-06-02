pragma ton-solidity >= 0.58.1;

/// @title This extension is used to add the owner role to the contract. It is used to manage contracts through external messages.
abstract contract OwnableExternal {
    
    /// Owner pubkey (0x...)
    uint256 private _owner;

    event OwnershipTransferred(uint256 oldOwner, uint256 newOwner);

    constructor (uint256 owner) public {
        _transferOwnership(owner);
    }

    function owner() public view virtual responsible returns (uint256 pubkey) {
        return {value: 0, flag: 64, bounce: false}_owner;
    }

    function transferOwnership(uint256 newOwner) public virtual onlyOwner {
        require(newOwner != 0, 100);
        _transferOwnership(newOwner);
    }

    function _transferOwnership(uint256 newOwner) internal virtual {
        uint256 oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    modifier onlyOwner() virtual {
        require(owner() == msg.pubkey(), 100);
        tvm.accept();
        _;
    }

}