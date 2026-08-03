/**
 * Smart Seat Allocation Engine for Ethara Seat Allocation & Project Mapping System
 * Implements proximity scoring, team clustering, distance metrics, and constraint enforcement.
 */

import { Employee, Project, Seat, SeatRecommendation } from '../types';

interface AllocationParams {
  employee: Employee;
  project?: Project;
  seats: Seat[];
  allEmployees: Employee[];
  preferredFloor?: number;
  preferredZone?: string;
  limit?: number;
}

export function generateSeatRecommendations({
  employee,
  project,
  seats,
  allEmployees,
  preferredFloor,
  preferredZone,
  limit = 5
}: AllocationParams): SeatRecommendation[] {
  // Constraint 1: Seat must be AVAILABLE or RELEASED
  const candidateSeats = seats.filter(s => s.status === 'AVAILABLE' || s.status === 'RELEASED');

  if (candidateSeats.length === 0) {
    return [];
  }

  // Determine target project floor & zone preference
  const targetFloor = preferredFloor || project?.preferredFloor || 1;
  const targetZone = preferredZone || project?.preferredZone || 'Zone A';

  // Find team members already allocated to seats
  const teamMembersWithSeats = allEmployees.filter(
    e => e.projectId === employee.projectId && e.seatId && e.id !== employee.id
  );

  // Map team member seat counts per (floor, zone)
  const teamSeatClusters = new Map<string, number>();
  teamMembersWithSeats.forEach(e => {
    if (e.floor && e.zone) {
      const key = `F${e.floor}-${e.zone}`;
      teamSeatClusters.set(key, (teamSeatClusters.get(key) || 0) + 1);
    }
  });

  const scoredSeats: SeatRecommendation[] = candidateSeats.map(seat => {
    let score = 50; // base score
    const reasons: string[] = [];

    // 1. Preferred Floor Match (+25 pts)
    if (seat.floor === targetFloor) {
      score += 25;
      reasons.push(`Direct floor match (Floor ${targetFloor})`);
    } else {
      const floorDiff = Math.abs(seat.floor - targetFloor);
      score -= floorDiff * 8;
      reasons.push(`${floorDiff} floor(s) away from project baseline`);
    }

    // 2. Preferred Zone Match (+20 pts)
    if (seat.zone === targetZone) {
      score += 20;
      reasons.push(`Direct zone match (${targetZone})`);
    } else {
      // Proximity score for adjacent zones
      const zoneLetters = ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E', 'Zone F', 'Zone G', 'Zone H', 'Zone I', 'Zone J'];
      const targetIdx = zoneLetters.indexOf(targetZone);
      const seatIdx = zoneLetters.indexOf(seat.zone);
      const zoneDist = Math.abs(targetIdx - seatIdx);
      if (zoneDist === 1) {
        score += 10;
        reasons.push(`Adjacent zone (${seat.zone})`);
      } else {
        score -= zoneDist * 3;
      }
    }

    // 3. Team Member Proximity Bonus (+20 max pts)
    const clusterKey = `F${seat.floor}-${seat.zone}`;
    const teammatesInZone = teamSeatClusters.get(clusterKey) || 0;
    if (teammatesInZone > 0) {
      const bonus = Math.min(20, teammatesInZone * 4);
      score += bonus;
      reasons.push(`${teammatesInZone} team member(s) seated in this zone`);
    }

    // Normalize score between 0 and 100
    const finalScore = Math.max(1, Math.min(100, Math.round(score)));

    const teamProximityScore = Math.min(100, teammatesInZone * 20 + (seat.floor === targetFloor ? 30 : 0));
    const departmentProximityScore = Math.min(100, (seat.zone === targetZone ? 50 : 20) + (seat.floor === targetFloor ? 50 : 20));

    const isAlternative = seat.floor !== targetFloor || seat.zone !== targetZone;

    return {
      seat,
      score: finalScore,
      reasons,
      teamProximityScore,
      departmentProximityScore,
      isAlternative
    };
  });

  // Sort descending by score
  scoredSeats.sort((a, b) => b.score - a.score);

  return scoredSeats.slice(0, limit);
}

/**
 * Validate seat allocation constraints
 */
export function validateSeatAllocation(
  employee: Employee,
  seat: Seat,
  allEmployees: Employee[],
  allSeats: Seat[]
): { valid: boolean; error?: string } {
  // Rule 1: One employee only one active seat
  if (employee.seatId && employee.seatId !== seat.id) {
    const existingSeat = allSeats.find(s => s.id === employee.seatId);
    if (existingSeat && existingSeat.status === 'OCCUPIED' && existingSeat.occupantId === employee.id) {
      return {
        valid: false,
        error: `Employee ${employee.empCode} already occupies seat ${existingSeat.seatNumber}. Release current seat first.`
      };
    }
  }

  // Rule 2 & 3: One seat only one employee / duplicate allocation impossible
  if (seat.status === 'OCCUPIED' && seat.occupantId && seat.occupantId !== employee.id) {
    return {
      valid: false,
      error: `Seat ${seat.seatNumber} is currently occupied by ${seat.occupantName}. Duplicate allocation impossible.`
    };
  }

  // Rule 4: Reserved seats cannot be allocated directly
  if (seat.status === 'RESERVED') {
    return {
      valid: false,
      error: `Seat ${seat.seatNumber} is RESERVED and cannot be allocated.`
    };
  }

  // Rule 5: Maintenance seats cannot be allocated
  if (seat.status === 'MAINTENANCE') {
    return {
      valid: false,
      error: `Seat ${seat.seatNumber} is under MAINTENANCE.`
    };
  }

  return { valid: true };
}
