/**
 * Static Demo Data
 * ================
 * Pre-loaded memory graph data for the demo page.
 * This allows the demo to work without any backend authentication.
 */

import type { MemoriesResponse } from "@/types/api";

export const DEMO_DATA: MemoriesResponse = {
  nodes: [
    {
      id: 45,
      local_id: 1,
      text: "User's name is Samiksha",
      type: "semantic",
      importance: 0.5,
      created_at: "2026-01-24T10:01:50.686960+00:00",
      connections: []
    },
    {
      id: 46,
      local_id: 2,
      text: "User lives in India",
      type: "semantic",
      importance: 0.5,
      created_at: "2026-01-24T10:02:14.119277+00:00",
      connections: []
    },
    {
      id: 47,
      local_id: 3,
      text: "User observes that there has been a sudden revolution of AI in India in recent years and is inspired by it",
      type: "semantic",
      importance: 0.5,
      created_at: "2026-01-24T10:03:07.708248+00:00",
      connections: []
    },
    {
      id: 48,
      local_id: 4,
      text: "User is actively developing AI skills and has been working on them for the last 5 months",
      type: "semantic",
      importance: 0.5,
      created_at: "2026-01-24T10:04:40.244305+00:00",
      connections: []
    },
    {
      id: 49,
      local_id: 5,
      text: "User is planning to learn classical Kathak dance",
      type: "semantic",
      importance: 0.5,
      created_at: "2026-01-24T10:05:34.695159+00:00",
      connections: [{ target_id: 6, target_global_id: 50, score: 0.878 }]
    },
    {
      id: 50,
      local_id: 6,
      text: "User is planning to start learning dance from next week",
      type: "bubble",
      importance: 0.6,
      created_at: "2026-01-24T10:05:35.357015+00:00",
      connections: [{ target_id: 5, target_global_id: 49, score: 0.878 }]
    },
    {
      id: 51,
      local_id: 7,
      text: "User will commute 11 km to attend dance classes",
      type: "semantic",
      importance: 0.5,
      created_at: "2026-01-24T10:06:52.419501+00:00",
      connections: [{ target_id: 8, target_global_id: 52, score: 0.814 }]
    },
    {
      id: 52,
      local_id: 8,
      text: "User is starting Kathak dance classes next week with 11 km commute",
      type: "bubble",
      importance: 0.6,
      created_at: "2026-01-24T10:06:53.162391+00:00",
      connections: [
        { target_id: 7, target_global_id: 51, score: 0.814 },
        { target_id: 5, target_global_id: 49, score: 0.699 },
        { target_id: 6, target_global_id: 50, score: 0.643 }
      ]
    },
    {
      id: 53,
      local_id: 9,
      text: "User is starting Kathak dance classes next week",
      type: "bubble",
      importance: 0.7,
      created_at: "2026-01-24T10:10:26.366197+00:00",
      connections: [
        { target_id: 8, target_global_id: 52, score: 0.846 },
        { target_id: 5, target_global_id: 49, score: 0.809 },
        { target_id: 6, target_global_id: 50, score: 0.776 }
      ]
    },
    {
      id: 54,
      local_id: 10,
      text: "User is planning to commute 11 km to Kathak dance classes starting next week",
      type: "bubble",
      importance: 0.6,
      created_at: "2026-01-24T10:14:04.329209+00:00",
      connections: [
        { target_id: 8, target_global_id: 52, score: 0.906 },
        { target_id: 7, target_global_id: 51, score: 0.876 },
        { target_id: 9, target_global_id: 53, score: 0.712 },
        { target_id: 5, target_global_id: 49, score: 0.624 },
        { target_id: 6, target_global_id: 50, score: 0.621 }
      ]
    },
    {
      id: 55,
      local_id: 11,
      text: "User is considering joining the evening batch for Kathak dance classes",
      type: "bubble",
      importance: 0.6,
      created_at: "2026-01-24T10:29:25.633630+00:00",
      connections: [
        { target_id: 9, target_global_id: 53, score: 0.816 },
        { target_id: 5, target_global_id: 49, score: 0.766 },
        { target_id: 8, target_global_id: 52, score: 0.735 },
        { target_id: 10, target_global_id: 54, score: 0.655 },
        { target_id: 6, target_global_id: 50, score: 0.622 }
      ]
    },
    {
      id: 58,
      local_id: 12,
      text: "User loves and enjoys dancing",
      type: "semantic",
      importance: 0.5,
      created_at: "2026-01-24T11:09:58.025235+00:00",
      connections: []
    }
  ],
  links: [
    { source: 49, target: 50, source_local: 5, target_local: 6, strength: 0.878 },
    { source: 51, target: 52, source_local: 7, target_local: 8, strength: 0.814 },
    { source: 52, target: 49, source_local: 8, target_local: 5, strength: 0.699 },
    { source: 52, target: 50, source_local: 8, target_local: 6, strength: 0.643 },
    { source: 53, target: 52, source_local: 9, target_local: 8, strength: 0.846 },
    { source: 53, target: 49, source_local: 9, target_local: 5, strength: 0.809 },
    { source: 53, target: 50, source_local: 9, target_local: 6, strength: 0.776 },
    { source: 54, target: 52, source_local: 10, target_local: 8, strength: 0.906 },
    { source: 54, target: 51, source_local: 10, target_local: 7, strength: 0.876 },
    { source: 54, target: 53, source_local: 10, target_local: 9, strength: 0.712 },
    { source: 54, target: 49, source_local: 10, target_local: 5, strength: 0.624 },
    { source: 54, target: 50, source_local: 10, target_local: 6, strength: 0.621 },
    { source: 55, target: 53, source_local: 11, target_local: 9, strength: 0.816 },
    { source: 55, target: 49, source_local: 11, target_local: 5, strength: 0.766 },
    { source: 55, target: 52, source_local: 11, target_local: 8, strength: 0.735 },
    { source: 55, target: 54, source_local: 11, target_local: 10, strength: 0.655 },
    { source: 55, target: 50, source_local: 11, target_local: 6, strength: 0.622 }
  ],
  id_mapping: { 45: 1, 46: 2, 47: 3, 48: 4, 49: 5, 50: 6, 51: 7, 52: 8, 53: 9, 54: 10, 55: 11, 58: 12 }
};
