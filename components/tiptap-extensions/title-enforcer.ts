import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import { TextSelection } from 'prosemirror-state'

function moveFromTitleToBody(editor: import('@tiptap/core').Editor) {
  const { state } = editor
  const { $from } = state.selection
  const inH1End = $from.parent.type.name === 'heading' &&
                  $from.parent.attrs.level === 1 &&
                  $from.parentOffset === $from.parent.content.size
  const isTitle = state.doc.firstChild === $from.node($from.depth)
  if (!inH1End || !isTitle) return false

  const tr = state.tr
  const afterTitlePos = $from.after($from.depth) // position after the H1 node
  let cursorPos = afterTitlePos
  const next = tr.doc.nodeAt(cursorPos)

  // Ensure exactly one HR
  if (next?.type.name !== 'horizontalRule') {
    tr.insert(cursorPos, state.schema.nodes.horizontalRule.create())
    cursorPos += 1 // HR node size is 1
  } else {
    // Collapse consecutive HRs into one
    let deleteFrom = null
    let scanPos = cursorPos + next.nodeSize
    let scan = tr.doc.nodeAt(scanPos)
    while (scan && scan.type.name === 'horizontalRule') {
      deleteFrom = deleteFrom ?? scanPos
      scanPos += scan.nodeSize
      scan = tr.doc.nodeAt(scanPos)
    }
    if (deleteFrom !== null) tr.delete(deleteFrom, scanPos)
    cursorPos += next.nodeSize
  }

  // Ensure a paragraph after the (single) HR
  const afterHrNode = tr.doc.nodeAt(cursorPos)
  if (!afterHrNode || afterHrNode.type.name !== 'paragraph') {
    tr.insert(cursorPos, state.schema.nodes.paragraph.create())
  }

  // Move caret to start of that paragraph
  tr.setSelection(TextSelection.near(tr.doc.resolve(cursorPos + 1)))
  editor.view.dispatch(tr)
  editor.view.focus()
  return true
}

export const TitleEnforcer = Extension.create({
  name: 'titleEnforcer',

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        return moveFromTitleToBody(editor)
      },

      ArrowRight: ({ editor }) => {
        return moveFromTitleToBody(editor)
      },

      ArrowDown: ({ editor }) => {
        return moveFromTitleToBody(editor)
      }
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('titleEnforcer'),
        appendTransaction: (transactions, oldState, newState) => {
          const tr = newState.tr
          let modified = false
          
          const firstChild = newState.doc.firstChild
          
          // Ensure first node is always H1
          if (!firstChild || 
              firstChild.type.name !== 'heading' || 
              firstChild.attrs.level !== 1) {
            
            // Get text content from whatever the first node is
            const textContent = firstChild ? firstChild.textContent : ''
            
            // Replace first node with H1 containing the text
            const h1Node = newState.schema.nodes.heading.create(
              { level: 1 },
              textContent ? newState.schema.text(textContent) : null
            )
            
            tr.replaceRangeWith(0, firstChild ? firstChild.nodeSize : 0, h1Node)
            modified = true
          }
          
          // If document is completely empty, add an empty H1
          if (newState.doc.content.size === 0) {
            const h1Node = newState.schema.nodes.heading.create(
              { level: 1 },
              null
            )
            tr.insert(0, h1Node)
            modified = true
          }
          
          return modified ? tr : null
        }
      })
    ]
  }
})
