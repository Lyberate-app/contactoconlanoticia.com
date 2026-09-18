import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Youtube from '@tiptap/extension-youtube'
import {
  Bold, Italic, Strikethrough, Code, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, Link2, Image as ImageIcon,
  Youtube as YoutubeIcon, Undo, Redo, AlignLeft, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCallback, useState } from 'react'
import { MediaPickerModal } from '@/components/media/MediaPickerModal'

interface TiptapEditorProps {
  content: string
  onChange: (json: string) => void
  placeholder?: string
}

export function TiptapEditor({ content, onChange, placeholder = 'Escribe el contenido aquí...' }: TiptapEditorProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        codeBlock: { languageClassPrefix: 'language-' },
      }),
      Image.configure({
        allowBase64: false,
        HTMLAttributes: { class: 'rounded-md my-4 max-w-full' },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { class: 'text-brand-600 underline underline-offset-2 cursor-pointer' },
      }),
      Placeholder.configure({ placeholder }),
      CharacterCount,
      Youtube.configure({
        controls: true,
        nocookie: true,
        HTMLAttributes: { class: 'rounded-lg overflow-hidden my-6' },
      }),
    ],
    content: content ? JSON.parse(content) : '',
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()))
    },
    editorProps: {
      attributes: {
        class: 'prose-editorial focus:outline-none min-h-[400px] px-1 py-2',
      },
    },
  })

  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)

  const setLink = useCallback(() => {
    if (!linkUrl.trim()) {
      editor?.chain().focus().unsetLink().run()
    } else {
      editor?.chain().focus().setLink({ href: linkUrl }).run()
    }
    setLinkDialogOpen(false)
    setLinkUrl('')
  }, [editor, linkUrl])

  const handleMediaSelect = useCallback((media: import('@portal/shared-types').Media) => {
    const src = media.conversions?.large?.url || media.url
    editor?.chain().focus().setImage({
      src,
      alt: media.alt_text || media.filename,
    }).run()
  }, [editor])

  const addYoutube = useCallback(() => {
    const url = prompt('URL del video de YouTube:')
    if (url) {
      editor?.commands.setYoutubeVideo({ src: url, width: 640, height: 360 })
    }
  }, [editor])

  if (!editor) return null

  const wordCount = editor.storage.characterCount?.words() ?? 0
  const charCount = editor.storage.characterCount?.characters() ?? 0

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* ── Toolbar ──────────────────────────────────── */}
      <div className="border-b border-gray-200 bg-gray-50 p-2 flex flex-wrap items-center gap-0.5">

        {/* Historial */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Deshacer (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Rehacer (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </ToolbarButton>
        </ToolbarGroup>

        <Divider />

        {/* Encabezados */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().setParagraph().run()}
            active={editor.isActive('paragraph')}
            title="Párrafo"
          >
            <AlignLeft className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="Subtítulo H2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
            title="Título H3"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>
        </ToolbarGroup>

        <Divider />

        {/* Formato de texto */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            title="Negrita (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Cursiva (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
            title="Tachado"
          >
            <Strikethrough className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive('code')}
            title="Código inline"
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>
        </ToolbarGroup>

        <Divider />

        {/* Listas */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Lista sin orden"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="Lista numerada"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            title="Cita"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Separador"
          >
            <Minus className="w-4 h-4" />
          </ToolbarButton>
        </ToolbarGroup>

        <Divider />

        {/* Multimedia */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => {
              setLinkUrl(editor.getAttributes('link').href ?? '')
              setLinkDialogOpen(true)
            }}
            active={editor.isActive('link')}
            title="Insertar enlace"
          >
            <Link2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setMediaPickerOpen(true)}
            title="Insertar imagen desde biblioteca"
          >
            <ImageIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={addYoutube} title="Insertar video YouTube">
            <YoutubeIcon className="w-4 h-4" />
          </ToolbarButton>
        </ToolbarGroup>

      </div>

      {/* ── Diálogo de enlace ─────────────────────────── */}
      {linkDialogOpen && (
        <div className="border-b border-gray-200 bg-blue-50 p-3 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-blue-500 shrink-0" />
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://ejemplo.com"
            className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            onKeyDown={(e) => { if (e.key === 'Enter') setLink() }}
            autoFocus
          />
          <button
            onClick={setLink}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Insertar
          </button>
          <button onClick={() => setLinkDialogOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Modal de Selección Multimedia ────────────── */}
      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        title="Insertar imagen en el contenido"
      />

      {/* ── Área de escritura ─────────────────────────── */}
      <div className="p-4 md:p-6">
        <EditorContent editor={editor} />
      </div>

      {/* ── Footer con contadores ─────────────────────── */}
      <div className="border-t border-gray-100 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
        <span>{wordCount} palabra{wordCount !== 1 ? 's' : ''}</span>
        <span>{charCount} caracteres</span>
      </div>
    </div>
  )
}

// ── Subcomponentes de la toolbar ──────────────────────────

function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>
}

function Divider() {
  return <div className="w-px h-5 bg-gray-200 mx-1" />
}

function ToolbarButton({
  children,
  onClick,
  active = false,
  disabled = false,
  title,
}: {
  children: React.ReactNode
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-1.5 rounded-md transition-colors text-gray-600',
        active ? 'bg-gray-200 text-gray-900' : 'hover:bg-gray-100 hover:text-gray-900',
        disabled && 'opacity-30 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  )
}

