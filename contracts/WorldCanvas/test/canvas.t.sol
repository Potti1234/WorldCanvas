// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/canvas.sol";

contract CanvasTest is Test {
    Canvas canvas;

    function setUp() public {
        canvas = new Canvas();
        // Set initial timestamp to a non-zero value to pass the cooldown check on first call
        vm.warp(10);
    }

    function testPlacePixel() public {
        uint8 x = 10;
        uint8 y = 20;
        string memory color = "#FF0000";
        canvas.placePixel(x, y, color);

        (
            address owner,
            uint8 resX,
            uint8 resY,
            string memory resColor,
            uint256 timestamp
        ) = canvas.getPixel(x, y);

        assertEq(owner, address(this), "Owner should be the test contract");
        assertEq(resX, x, "x coordinate should match");
        assertEq(resY, y, "y coordinate should match");
        assertEq(resColor, color, "color should match");
        assertTrue(timestamp > 0, "Timestamp should be set");
    }

    function test_RevertWhen_PlacingPixelDuringCooldown() public {
        canvas.placePixel(1, 1, "#FFFFFF");
        vm.expectRevert("You can only place a pixel every 5 seconds.");
        canvas.placePixel(2, 2, "#000000");
    }

    function testPlacePixelAfterCooldown() public {
        canvas.placePixel(1, 1, "#FFFFFF");

        // Warp time forward by the cooldown duration
        vm.warp(block.timestamp + canvas.COOLDOWN_TIME());

        canvas.placePixel(2, 2, "#000000");

        (address owner, , , , ) = canvas.getPixel(2, 2);
        assertEq(
            owner,
            address(this),
            "Should be able to place a pixel after cooldown"
        );
    }
}
