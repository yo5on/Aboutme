// Timeline anchors: one per résumé entry (Resume.tsx sets data-point on each entry).
// Single source of truth for the node count — Scene.tsx derives the frame ranges from it
// (node k sits at frame k·FRAMES_PER_NODE) and its STOPS list needs one camera stop per node.
// Adding/removing an entry: change this list, Resume.tsx's entries, and Scene.tsx's STOPS together.
export const FOCUS_POINTS = ['focus-1', 'focus-2', 'focus-3', 'focus-4', 'focus-5'] as const

// Frames each timeline node occupies on the camera path.
export const FRAMES_PER_NODE = 50
