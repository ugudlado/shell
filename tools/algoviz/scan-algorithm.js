/**
 * SCAN (Elevator) Disk Scheduling Algorithm
 *
 * Pure functions — no DOM dependency.
 * The elevator services requests in the current direction first,
 * then reverses and services the remaining requests.
 */
var ScanAlgorithm = (() => {
  "use strict";

  /**
   * Solve the SCAN scheduling problem.
   *
   * @param {number[]} requests - Array of floor/track numbers to service
   * @param {number} startPosition - Initial position of the elevator
   * @param {"up"|"down"} direction - Initial direction of movement
   * @param {number} maxFloor - Maximum floor number (min is always 0)
   * @returns {{
   *   order: number[],
   *   distances: number[],
   *   totalDistance: number,
   *   steps: Array<{position: number, target: number, direction: string, action: string, distanceSoFar: number}>
   * }}
   */
  function solve(requests, startPosition, direction, maxFloor) {
    if (requests.length === 0) {
      return { order: [], distances: [], totalDistance: 0, steps: [] };
    }

    // Split requests into above (>= start) and below (< start)
    const above = [];
    const below = [];

    for (const r of requests) {
      if (r >= startPosition) {
        above.push(r);
      } else {
        below.push(r);
      }
    }

    // Sort above ascending, below descending
    above.sort((a, b) => a - b);
    below.sort((a, b) => b - a);

    // Build the service order based on initial direction
    let order;
    if (direction === "up") {
      order = above.concat(below);
    } else {
      order = below.concat(above);
    }

    // Calculate distances, steps, and total distance
    const distances = [];
    const steps = [];
    let currentPos = startPosition;
    let totalDistance = 0;
    let currentDirection = direction;

    for (let i = 0; i < order.length; i++) {
      const target = order[i];
      const dist = Math.abs(target - currentPos);
      totalDistance += dist;
      distances.push(dist);

      // Determine direction for this step
      if (target > currentPos) {
        currentDirection = "up";
      } else if (target < currentPos) {
        currentDirection = "down";
      }
      // If target === currentPos, keep current direction

      const action = "Service floor " + target;

      steps.push({
        position: currentPos,
        target: target,
        direction: currentDirection,
        action: action,
        distanceSoFar: totalDistance
      });

      currentPos = target;
    }

    return { order, distances, totalDistance, steps };
  }

  return { solve };
})();
