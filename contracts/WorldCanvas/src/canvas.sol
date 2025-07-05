// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Canvas {
    uint8 public constant CANVAS_WIDTH = 100;
    uint8 public constant CANVAS_HEIGHT = 100;
    uint256 public constant COOLDOWN_TIME = 5 seconds;

    struct Pixel {
        address owner;
        uint8 x;
        uint8 y;
        string color;
        uint256 timestamp;
    }

    Pixel[CANVAS_WIDTH][CANVAS_HEIGHT] public pixels;

    mapping(address => uint256) public lastPlacedTimestamp;

    event PixelPlaced(
        address indexed owner,
        uint8 x,
        uint8 y,
        string color,
        uint256 timestamp
    );

    function placePixel(uint8 x, uint8 y, string memory color) public {
        require(x >= 0 && x <= CANVAS_WIDTH, "x coordinate is out of bounds.");
        require(y >= 0 && y <= CANVAS_HEIGHT, "y coordinate is out of bounds.");

        uint256 lastPlaced = lastPlacedTimestamp[msg.sender];
        require(
            block.timestamp >= lastPlaced + COOLDOWN_TIME,
            "You can only place a pixel every 5 seconds."
        );

        pixels[x][y] = Pixel(msg.sender, x, y, color, block.timestamp);
        lastPlacedTimestamp[msg.sender] = block.timestamp;

        emit PixelPlaced(msg.sender, x, y, color, block.timestamp);
    }

    function getPixel(
        uint8 x,
        uint8 y
    ) public view returns (address, uint8, uint8, string memory, uint256) {
        Pixel storage p = pixels[x][y];
        return (p.owner, p.x, p.y, p.color, p.timestamp);
    }
}
