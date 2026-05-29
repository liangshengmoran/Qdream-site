interface ParsedBookmark {
  title: string
  url: string
}

export interface ParsedFolder {
  name: string
  bookmarks: ParsedBookmark[]
  children: ParsedFolder[]
}

/**
 * Parse Netscape Bookmark HTML format exported from Chrome/Edge/Firefox
 */
export function parseBookmarkHtml(html: string): ParsedFolder[] {
  const folders: ParsedFolder[] = []
  const stack: { folder: ParsedFolder; depth: number }[] = []
  const addedToRoot = new Set<ParsedFolder>()

  // Strip everything before first <DT> and after last </DL>
  const bodyMatch = html.match(/<DL[^>]*>([\s\S]*)<\/DL>/i)
  if (!bodyMatch) return folders

  const body = bodyMatch[1]

  // Parse each <DT> item
  const dtRegex = /<DT>(.*?)(?=<DT>|<\/DL>|$)/gs
  let match: RegExpExecArray | null

  while ((match = dtRegex.exec(body)) !== null) {
    const item = match[1].trim()

    // Check if it's a folder: <H3>Name</H3>
    const h3Match = item.match(/<H3[^>]*>([^<]*)<\/H3>/i)
    if (h3Match) {
      const name = h3Match[1].trim()
      const folder: ParsedFolder = { name, bookmarks: [], children: [] }

      // Find parent: pop stack until we find a shallower depth
      const currentDepth = getDepth(match.index, body)
      while (stack.length > 0 && stack[stack.length - 1].depth >= currentDepth) {
        const done = stack.pop()!
        if (stack.length > 0) {
          stack[stack.length - 1].folder.children.push(done.folder)
        } else if (!addedToRoot.has(done.folder)) {
          folders.push(done.folder)
          addedToRoot.add(done.folder)
        }
      }

      if (stack.length > 0) {
        stack[stack.length - 1].folder.children.push(folder)
      } else {
        folders.push(folder)
        addedToRoot.add(folder)
      }
      stack.push({ folder, depth: currentDepth })
      continue
    }

    // Check if it's a bookmark: <A HREF="url" ...>Title</A>
    const aMatch = item.match(/<A[^>]+HREF="([^"]*)"[^>]*>([^<]*)<\/A>/i)
    if (aMatch) {
      const url = aMatch[1].trim()
      const title = aMatch[2].trim()

      if (stack.length > 0) {
        stack[stack.length - 1].folder.bookmarks.push({ title, url })
      } else {
        // Bookmark at root level, create default folder
        let rootFolder = folders.find((f) => f.name === '书签栏')
        if (!rootFolder) {
          rootFolder = { name: '书签栏', bookmarks: [], children: [] }
          folders.push(rootFolder)
        }
        rootFolder.bookmarks.push({ title, url })
      }
    }
  }

  // Pop remaining stack
  while (stack.length > 1) {
    const done = stack.pop()!
    stack[stack.length - 1].folder.children.push(done.folder)
  }
  if (stack.length === 1) {
    folders.push(stack.pop()!.folder)
  }

  return folders
}

/** Calculate nesting depth by counting <DL> and </DL> before position */
function getDepth(position: number, html: string): number {
  const before = html.slice(0, position)
  const opens = (before.match(/<DL[^>]*>/gi) || []).length
  const closes = (before.match(/<\/DL>/gi) || []).length
  return opens - closes
}

/** Flatten folder tree into a flat list with folder paths */
export function flattenFolders(
  folders: ParsedFolder[],
  parentPath = ''
): { path: string; name: string; bookmarks: ParsedBookmark[] }[] {
  const seen = new Set<string>()
  const result: { path: string; name: string; bookmarks: ParsedBookmark[] }[] = []
  for (const folder of folders) {
    const fullPath = parentPath ? `${parentPath} > ${folder.name}` : folder.name
    if (folder.bookmarks.length > 0) {
      // Deduplicate: skip folders with the same name whose bookmarks are identical
      const id = fullPath + '|' + folder.bookmarks.map(b => b.url).sort().join(',')
      if (!seen.has(id)) {
        seen.add(id)
        result.push({ path: fullPath, name: folder.name, bookmarks: folder.bookmarks })
      }
    }
    if (folder.children.length > 0) {
      result.push(...flattenFolders(folder.children, fullPath))
    }
  }
  return result
}
