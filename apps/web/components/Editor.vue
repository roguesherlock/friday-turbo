<script setup lang="ts">
import { $getRoot, $getSelection, EditorState } from "lexical"
import { ref } from "vue"

import {
  LexicalAutoFocusPlugin,
  LexicalComposer,
  LexicalContentEditable,
  LexicalHistoryPlugin,
  LexicalOnChangePlugin,
  LexicalRichTextPlugin,
  LexicalMarkdownShortcutPlugin,
} from "lexical-vue"
import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import { LinkNode } from "@lexical/link"
import { ListNode, ListItemNode } from "@lexical/list"
import { CodeNode } from "@lexical/code"
import logger from "~~/lib/logger"

const config = {
  namespace: "editor",

  editable: true,
  nodes: [HeadingNode, QuoteNode, CodeNode, ListNode, ListItemNode, LinkNode],
  theme: {
    // Theme styling goes here
  },
}

const onError = (error: Error) => {
  logger.log(error)
}

// When the editor changes, you can get notified via the
// LexicalOnChangePlugin!
function onChange(editorState: EditorState) {
  editorState.read(() => {
    // Read the contents of the EditorState here.
    const root = $getRoot()
    const selection = $getSelection()

    console.log(root, selection)
  })
}

// Two-way binding
const content = ref("")
</script>

<template>
  <LexicalComposer :initial-config="config" @error="onError">
    <LexicalRichTextPlugin class="prose">
      <template #contentEditable>
        <div class="prose">
          <LexicalContentEditable />
        </div>
      </template>
      <template #placeholder>
        <div>Enter some text...</div>
      </template>
    </LexicalRichTextPlugin>
    <LexicalOnChangePlugin v-model="content" @change="onChange" />
    <LexicalHistoryPlugin />
    <LexicalAutoFocusPlugin />
    <LexicalMarkdownShortcutPlugin />
  </LexicalComposer>
</template>
