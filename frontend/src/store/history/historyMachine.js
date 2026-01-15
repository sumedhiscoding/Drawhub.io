import { createMachine, assign } from 'xstate';

const HISTORY_MAX_SIZE = 100;

/**
 * History Node - stores minimal diffs (before/after patches)
 * No commands, no full snapshots - just patches
 */
class HistoryNode {
  constructor({ before, after, elementId }) {
    this.before = before; // patch to apply on undo (null = element didn't exist)
    this.after = after; // patch to apply on redo (null = element was removed)
    this.elementId = elementId;
    this.prev = null;
    this.next = null;
  }
}

/**
 * Minimal undo/redo state machine
 *
 * SINGLE RESPONSIBILITY: Navigate history and return patches
 * Does NOT store elements - that's the consumer's job
 *
 * States:
 * - idle: Ready for actions
 * - undoing: Processing undo
 * - redoing: Processing redo
 */
const historyMachine = createMachine(
  {
    id: 'history',
    initial: 'idle',
    context: {
      head: null, // First node in history
      current: null, // Current position in history
      size: 0,
      maxSize: HISTORY_MAX_SIZE,
      lastPatch: null, // The patch returned from last undo/redo
    },
    states: {
      idle: {
        on: {
          // Record a change (after action is complete)
          RECORD: {
            actions: 'recordChange',
          },
          UNDO: {
            target: 'undoing',
            guard: 'canUndo',
          },
          REDO: {
            target: 'redoing',
            guard: 'canRedo',
          },
          CLEAR: {
            actions: 'clearHistory',
          },
        },
      },
      undoing: {
        entry: 'executeUndo',
        always: { target: 'idle' },
      },
      redoing: {
        entry: 'executeRedo',
        always: { target: 'idle' },
      },
    },
  },
  {
    guards: {
      canUndo: ({ context }) => context.current !== null,
      canRedo: ({ context }) => {
        if (!context.current) {
          return context.head !== null;
        }
        return context.current.next !== null;
      },
    },
    actions: {
      /**
       * Record a change to history
       * Event shape: { type: 'RECORD', before, after, elementId }
       *
       * before: patch to restore previous state (null if element is new)
       * after: patch to restore new state (null if element was deleted)
       * elementId: the element this change affects
       */
      recordChange: assign(({ context, event }) => {
        const { before, after, elementId } = event;

        const node = new HistoryNode({ before, after, elementId });

        let newHead = context.head;
        let newSize = context.size;

        if (!context.head) {
          // First node
          newHead = node;
          newSize = 1;
        } else if (!context.current) {
          // All undone - new action replaces everything
          newHead = node;
          newSize = 1;
        } else {
          // Normal: add after current, truncate redo branch
          node.prev = context.current;
          context.current.next = node;

          // Recalculate size
          newSize = 1;
          let n = newHead;
          while (n && n !== node) {
            newSize++;
            n = n.next;
          }
        }

        // Trim to max size
        while (newSize > context.maxSize && newHead) {
          newHead = newHead.next;
          if (newHead) newHead.prev = null;
          newSize--;
        }

        return {
          head: newHead,
          current: node,
          size: newSize,
          lastPatch: null,
        };
      }),

      /**
       * Execute undo - move pointer back and return the "before" patch
       */
      executeUndo: assign(({ context }) => {
        if (!context.current) return { lastPatch: null };

        const patch = context.current.before;
        const elementId = context.current.elementId;

        return {
          current: context.current.prev,
          lastPatch: { patch, elementId, action: 'undo' },
        };
      }),

      /**
       * Execute redo - move pointer forward and return the "after" patch
       */
      executeRedo: assign(({ context }) => {
        let nextNode;
        if (!context.current) {
          nextNode = context.head;
        } else {
          nextNode = context.current.next;
        }

        if (!nextNode) return { lastPatch: null };

        const patch = nextNode.after;
        const elementId = nextNode.elementId;

        return {
          current: nextNode,
          lastPatch: { patch, elementId, action: 'redo' },
        };
      }),

      /**
       * Clear all history
       */
      clearHistory: assign(() => ({
        head: null,
        current: null,
        size: 0,
        lastPatch: null,
      })),
    },
  },
);

export { historyMachine, HistoryNode, HISTORY_MAX_SIZE };
export default historyMachine;
