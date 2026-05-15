// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CharityDonation
 * @dev Transparent charity donation platform on blockchain
 * @notice Allows anyone to create campaigns and donate ETH transparently
 */
contract CharityDonation is ReentrancyGuard {
    // ==================== STRUCTS ====================

    struct Campaign {
        uint256 id;
        address payable owner;
        string title;
        string description;
        string category;       // Education, Medical, Disaster, Environment, etc.
        string ipfsHash;       // IPFS CID for campaign image/metadata
        uint256 goal;          // Target amount in wei
        uint256 raised;        // Total raised in wei
        uint256 deadline;      // Unix timestamp
        uint256 donorCount;    // Number of unique donors
        bool active;           // Is campaign accepting donations
        bool withdrawn;        // Has owner withdrawn funds
        uint256 createdAt;     // Creation timestamp
    }

    struct Donation {
        address donor;
        uint256 campaignId;
        uint256 amount;        // Amount in wei
        uint256 timestamp;
        string message;        // Optional donor message
    }

    struct TransactionRecord {
        string txType;         // "DONATE", "CREATE", "WITHDRAW"
        uint256 campaignId;
        address actor;
        uint256 amount;
        uint256 timestamp;
        string campaignTitle;
    }

    // ==================== STATE VARIABLES ====================

    uint256 public campaignCount;
    address public platformOwner;
    uint256 public totalDonations;      // Total ETH donated (wei)
    uint256 public totalCampaigns;      // Alias for campaignCount
    uint256 public constant PLATFORM_FEE = 0; // 0% fee for transparency demo

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => Donation[]) public campaignDonations;
    mapping(address => Donation[]) public userDonations;
    mapping(address => uint256[]) public userCreatedCampaigns;
    TransactionRecord[] public allTransactions;

    // ==================== EVENTS ====================

    event CampaignCreated(
        uint256 indexed id,
        address indexed owner,
        string title,
        string category,
        uint256 goal,
        uint256 deadline,
        string ipfsHash,
        uint256 timestamp
    );

    event DonationReceived(
        uint256 indexed campaignId,
        address indexed donor,
        uint256 amount,
        string message,
        uint256 timestamp,
        uint256 totalRaised
    );

    event FundsWithdrawn(
        uint256 indexed campaignId,
        address indexed owner,
        uint256 amount,
        uint256 timestamp
    );

    event CampaignStatusChanged(
        uint256 indexed campaignId,
        bool active,
        uint256 timestamp
    );

    // ==================== MODIFIERS ====================

    modifier campaignExists(uint256 _id) {
        require(_id > 0 && _id <= campaignCount, "Campaign does not exist");
        _;
    }

    modifier onlyCampaignOwner(uint256 _id) {
        require(campaigns[_id].owner == msg.sender, "Not campaign owner");
        _;
    }

    modifier campaignIsActive(uint256 _id) {
        require(campaigns[_id].active, "Campaign is not active");
        require(block.timestamp <= campaigns[_id].deadline, "Campaign has expired");
        _;
    }

    // ==================== CONSTRUCTOR ====================

    constructor() {
        platformOwner = msg.sender;
    }

    // ==================== MAIN FUNCTIONS ====================

    /**
     * @dev Create a new charity campaign
     * @param _title Campaign title
     * @param _description Campaign description
     * @param _category Campaign category
     * @param _ipfsHash IPFS hash of campaign image/metadata
     * @param _goal Fundraising goal in wei
     * @param _durationDays Campaign duration in days
     */
    function createCampaign(
        string memory _title,
        string memory _description,
        string memory _category,
        string memory _ipfsHash,
        uint256 _goal,
        uint256 _durationDays
    ) external returns (uint256) {
        require(bytes(_title).length > 0, "Title is required");
        require(bytes(_description).length > 0, "Description is required");
        require(_goal > 0, "Goal must be greater than 0");
        require(_durationDays >= 1 && _durationDays <= 365, "Duration must be 1-365 days");

        campaignCount++;
        totalCampaigns = campaignCount;
        uint256 deadline = block.timestamp + (_durationDays * 1 days);

        campaigns[campaignCount] = Campaign({
            id: campaignCount,
            owner: payable(msg.sender),
            title: _title,
            description: _description,
            category: _category,
            ipfsHash: _ipfsHash,
            goal: _goal,
            raised: 0,
            deadline: deadline,
            donorCount: 0,
            active: true,
            withdrawn: false,
            createdAt: block.timestamp
        });

        userCreatedCampaigns[msg.sender].push(campaignCount);

        // Record transaction
        allTransactions.push(TransactionRecord({
            txType: "CREATE",
            campaignId: campaignCount,
            actor: msg.sender,
            amount: 0,
            timestamp: block.timestamp,
            campaignTitle: _title
        }));

        emit CampaignCreated(
            campaignCount,
            msg.sender,
            _title,
            _category,
            _goal,
            deadline,
            _ipfsHash,
            block.timestamp
        );

        return campaignCount;
    }

    /**
     * @dev Donate ETH to a campaign
     * @param _campaignId ID of the campaign to donate to
     * @param _message Optional message from donor
     */
    function donate(uint256 _campaignId, string memory _message)
        external
        payable
        campaignExists(_campaignId)
        campaignIsActive(_campaignId)
        nonReentrant
    {
        require(msg.value > 0, "Donation must be greater than 0");

        Campaign storage campaign = campaigns[_campaignId];
        campaign.raised += msg.value;
        campaign.donorCount++;
        totalDonations += msg.value;

        Donation memory newDonation = Donation({
            donor: msg.sender,
            campaignId: _campaignId,
            amount: msg.value,
            timestamp: block.timestamp,
            message: _message
        });

        campaignDonations[_campaignId].push(newDonation);
        userDonations[msg.sender].push(newDonation);

        // Record transaction
        allTransactions.push(TransactionRecord({
            txType: "DONATE",
            campaignId: _campaignId,
            actor: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp,
            campaignTitle: campaign.title
        }));

        emit DonationReceived(
            _campaignId,
            msg.sender,
            msg.value,
            _message,
            block.timestamp,
            campaign.raised
        );
    }

    /**
     * @dev Withdraw raised funds (only campaign owner)
     * @param _campaignId ID of the campaign
     */
    function withdrawFunds(uint256 _campaignId)
        external
        campaignExists(_campaignId)
        onlyCampaignOwner(_campaignId)
        nonReentrant
    {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.raised > 0, "No funds to withdraw");
        require(!campaign.withdrawn, "Funds already withdrawn");

        uint256 amount = campaign.raised;
        campaign.withdrawn = true;
        campaign.active = false;

        // Record transaction
        allTransactions.push(TransactionRecord({
            txType: "WITHDRAW",
            campaignId: _campaignId,
            actor: msg.sender,
            amount: amount,
            timestamp: block.timestamp,
            campaignTitle: campaign.title
        }));

        // Transfer funds to campaign owner
        (bool success, ) = campaign.owner.call{value: amount}("");
        require(success, "Transfer failed");

        emit FundsWithdrawn(_campaignId, msg.sender, amount, block.timestamp);
        emit CampaignStatusChanged(_campaignId, false, block.timestamp);
    }

    /**
     * @dev Toggle campaign active status (only campaign owner)
     */
    function toggleCampaign(uint256 _campaignId)
        external
        campaignExists(_campaignId)
        onlyCampaignOwner(_campaignId)
    {
        Campaign storage campaign = campaigns[_campaignId];
        require(!campaign.withdrawn, "Campaign already completed");
        campaign.active = !campaign.active;
        emit CampaignStatusChanged(_campaignId, campaign.active, block.timestamp);
    }

    // ==================== VIEW FUNCTIONS ====================

    /**
     * @dev Get all campaigns
     */
    function getCampaigns() external view returns (Campaign[] memory) {
        Campaign[] memory allCampaigns = new Campaign[](campaignCount);
        for (uint256 i = 1; i <= campaignCount; i++) {
            allCampaigns[i - 1] = campaigns[i];
        }
        return allCampaigns;
    }

    /**
     * @dev Get a single campaign by ID
     */
    function getCampaign(uint256 _campaignId)
        external
        view
        campaignExists(_campaignId)
        returns (Campaign memory)
    {
        return campaigns[_campaignId];
    }

    /**
     * @dev Get all donations for a campaign
     */
    function getCampaignDonations(uint256 _campaignId)
        external
        view
        campaignExists(_campaignId)
        returns (Donation[] memory)
    {
        return campaignDonations[_campaignId];
    }

    /**
     * @dev Get all donations made by a user
     */
    function getUserDonations(address _user)
        external
        view
        returns (Donation[] memory)
    {
        return userDonations[_user];
    }

    /**
     * @dev Get all campaigns created by a user
     */
    function getUserCreatedCampaigns(address _user)
        external
        view
        returns (uint256[] memory)
    {
        return userCreatedCampaigns[_user];
    }

    /**
     * @dev Get all platform transactions (global history)
     */
    function getAllTransactions()
        external
        view
        returns (TransactionRecord[] memory)
    {
        return allTransactions;
    }

    /**
     * @dev Get platform statistics
     */
    function getPlatformStats()
        external
        view
        returns (
            uint256 _totalCampaigns,
            uint256 _totalDonations,
            uint256 _activeCampaigns
        )
    {
        uint256 active = 0;
        for (uint256 i = 1; i <= campaignCount; i++) {
            if (campaigns[i].active && block.timestamp <= campaigns[i].deadline) {
                active++;
            }
        }
        return (campaignCount, totalDonations, active);
    }

    /**
     * @dev Get transaction count
     */
    function getTransactionCount() external view returns (uint256) {
        return allTransactions.length;
    }
}
