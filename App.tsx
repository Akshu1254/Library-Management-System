import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import type { Book } from './types'
import {
  BookOpen,
  Plus,
  Search,
  Eye,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Library,
  FileText,
  Printer,
} from 'lucide-react'

type View = 'list' | 'search' | 'report'
type ModalType = 'add' | 'issue' | 'delete' | null

export default function App() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Book[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [modal, setModal] = useState<ModalType>(null)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // form states
  const [addForm, setAddForm] = useState({ book_id: '', name: '', author: '' })
  const [issueStudent, setIssueStudent] = useState('')

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchBooks = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      showToast('Failed to load books', 'error')
    } else {
      setBooks(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  const handleAddBook = async () => {
    if (!addForm.book_id || !addForm.name || !addForm.author) {
      showToast('Please fill all fields', 'error')
      return
    }
    const { error } = await supabase.from('books').insert({
      book_id: addForm.book_id,
      name: addForm.name,
      author: addForm.author,
      status: 'Available',
    })
    if (error) {
      showToast(error.message, 'error')
      return
    }
    showToast('Book added successfully!')
    setAddForm({ book_id: '', name: '', author: '' })
    setModal(null)
    fetchBooks()
  }

  const handleIssueBook = async () => {
    if (!selectedBook) return
    if (!issueStudent.trim()) {
      showToast('Please enter student name', 'error')
      return
    }
    const { error } = await supabase
      .from('books')
      .update({ status: 'Issued', issued_to: issueStudent.trim() })
      .eq('id', selectedBook.id)
    if (error) {
      showToast(error.message, 'error')
      return
    }
    showToast(`Book issued to ${issueStudent.trim()}`)
    setIssueStudent('')
    setSelectedBook(null)
    setModal(null)
    fetchBooks()
  }

  const handleReturnBook = async (book: Book) => {
    const { error } = await supabase
      .from('books')
      .update({ status: 'Available', issued_to: null })
      .eq('id', book.id)
    if (error) {
      showToast(error.message, 'error')
      return
    }
    showToast('Book returned successfully!')
    fetchBooks()
  }

  const handleDeleteBook = async () => {
    if (!selectedBook) return
    const { error } = await supabase.from('books').delete().eq('id', selectedBook.id)
    if (error) {
      showToast(error.message, 'error')
      return
    }
    showToast('Book deleted successfully!')
    setSelectedBook(null)
    setModal(null)
    fetchBooks()
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setHasSearched(false)
      setSearchResults([])
      return
    }
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .or(`book_id.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%`)
      .order('created_at', { ascending: false })
    if (error) {
      showToast('Search failed', 'error')
      return
    }
    setSearchResults(data || [])
    setHasSearched(true)
  }

  const stats = {
    total: books.length,
    available: books.filter((b) => b.status === 'Available').length,
    issued: books.filter((b) => b.status === 'Issued').length,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--neutral-50)' }}>
      {/* Header */}
      <header
        className="no-print"
        style={{
          background: 'linear-gradient(135deg, var(--primary-700) 0%, var(--primary-900) 100%)',
          padding: '24px 0',
          boxShadow: 'var(--shadow-lg)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 'var(--radius-md)',
                padding: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Library size={28} color="#fff" />
            </div>
            <div>
              <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>Library Management System</h1>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 2 }}>
                Manage your books with ease
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="no-print" style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 0' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          <StatCard label="Total Books" value={stats.total} color="var(--primary-500)" bg="var(--primary-50)" />
          <StatCard label="Available" value={stats.available} color="var(--success-600)" bg="var(--success-50)" />
          <StatCard label="Issued" value={stats.issued} color="var(--warning-600)" bg="var(--warning-50)" />
        </div>
      </div>

      {/* Toolbar */}
      <div className="no-print" style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 20,
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <TabButton active={view === 'list'} onClick={() => setView('list')} icon={<Eye size={18} />}>
              All Books
            </TabButton>
            <TabButton active={view === 'search'} onClick={() => setView('search')} icon={<Search size={18} />}>
              Search
            </TabButton>
            <TabButton active={view === 'report'} onClick={() => setView('report')} icon={<FileText size={18} />}>
              Project Report
            </TabButton>
          </div>
          {view !== 'report' && (
            <button
              onClick={() => setModal('add')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--primary-600)',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: 'var(--radius-md)',
                fontSize: 14,
                fontWeight: 500,
                boxShadow: 'var(--shadow-md)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--primary-700)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--primary-600)')}
            >
              <Plus size={18} />
              Add Book
            </button>
          )}
        </div>

        {/* Search View */}
        {view === 'search' && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Search by Book ID, Name, or Author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '2px solid var(--neutral-200)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 15,
                  outline: 'none',
                  background: '#fff',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primary-400)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--neutral-200)')}
              />
              <button
                onClick={handleSearch}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'var(--primary-600)',
                  color: '#fff',
                  padding: '12px 20px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 14,
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--primary-700)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--primary-600)')}
              >
                <Search size={18} />
                Search
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {view === 'list' || view === 'search' ? (
          loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--neutral-400)' }}>
              <BookOpen size={48} style={{ marginBottom: 16, opacity: 0.4 }} />
              <p style={{ fontSize: 16 }}>Loading books...</p>
            </div>
          ) : view === 'list' ? (
            books.length === 0 ? (
              <EmptyState />
            ) : (
              <BookGrid
                books={books}
                onIssue={(book) => {
                  setSelectedBook(book)
                  setModal('issue')
                }}
                onReturn={handleReturnBook}
                onDelete={(book) => {
                  setSelectedBook(book)
                  setModal('delete')
                }}
              />
            )
          ) : hasSearched ? (
            searchResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--neutral-400)' }}>
                <Search size={48} style={{ marginBottom: 16, opacity: 0.4 }} />
                <p style={{ fontSize: 16 }}>No books found matching "{searchQuery}"</p>
              </div>
            ) : (
              <BookGrid
                books={searchResults}
                onIssue={(book) => {
                  setSelectedBook(book)
                  setModal('issue')
                }}
                onReturn={handleReturnBook}
                onDelete={(book) => {
                  setSelectedBook(book)
                  setModal('delete')
                }}
              />
            )
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--neutral-400)' }}>
              <Search size={48} style={{ marginBottom: 16, opacity: 0.4 }} />
              <p style={{ fontSize: 16 }}>Type a search query and press Search</p>
            </div>
          )
        ) : null}
      </div>

      {/* Report View */}
      {view === 'report' && <ProjectReport />}

      {/* Modals */}
      {modal === 'add' && (
        <Modal title="Add New Book" onClose={() => setModal(null)}>
          <FormField label="Book ID">
            <input
              type="text"
              value={addForm.book_id}
              onChange={(e) => setAddForm({ ...addForm, book_id: e.target.value })}
              placeholder="e.g. B001"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primary-400)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--neutral-200)')}
            />
          </FormField>
          <FormField label="Book Name">
            <input
              type="text"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              placeholder="e.g. The Great Gatsby"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primary-400)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--neutral-200)')}
            />
          </FormField>
          <FormField label="Author Name">
            <input
              type="text"
              value={addForm.author}
              onChange={(e) => setAddForm({ ...addForm, author: e.target.value })}
              placeholder="e.g. F. Scott Fitzgerald"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primary-400)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--neutral-200)')}
            />
          </FormField>
          <ModalActions
            onConfirm={handleAddBook}
            onCancel={() => setModal(null)}
            confirmLabel="Add Book"
          />
        </Modal>
      )}

      {modal === 'issue' && selectedBook && (
        <Modal title="Issue Book" onClose={() => setModal(null)}>
          <div style={{ marginBottom: 20, padding: 16, background: 'var(--neutral-50)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontSize: 14, color: 'var(--neutral-500)', marginBottom: 4 }}>Book</p>
            <p style={{ fontSize: 16, fontWeight: 600 }}>{selectedBook.name}</p>
            <p style={{ fontSize: 14, color: 'var(--neutral-500)' }}>
              ID: {selectedBook.book_id} — {selectedBook.author}
            </p>
          </div>
          <FormField label="Student Name">
            <input
              type="text"
              value={issueStudent}
              onChange={(e) => setIssueStudent(e.target.value)}
              placeholder="e.g. John Doe"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primary-400)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--neutral-200)')}
            />
          </FormField>
          <ModalActions
            onConfirm={handleIssueBook}
            onCancel={() => setModal(null)}
            confirmLabel="Issue Book"
          />
        </Modal>
      )}

      {modal === 'delete' && selectedBook && (
        <Modal title="Delete Book" onClose={() => setModal(null)}>
          <p style={{ fontSize: 16, color: 'var(--neutral-700)', marginBottom: 8 }}>
            Are you sure you want to delete this book?
          </p>
          <div style={{ marginBottom: 20, padding: 16, background: 'var(--error-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--error-100)' }}>
            <p style={{ fontSize: 16, fontWeight: 600 }}>{selectedBook.name}</p>
            <p style={{ fontSize: 14, color: 'var(--neutral-500)' }}>
              ID: {selectedBook.book_id} — {selectedBook.author}
            </p>
          </div>
          <p style={{ fontSize: 14, color: 'var(--error-600)', marginBottom: 20 }}>
            This action cannot be undone.
          </p>
          <ModalActions
            onConfirm={handleDeleteBook}
            onCancel={() => setModal(null)}
            confirmLabel="Delete"
            danger
          />
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: toast.type === 'success' ? 'var(--success-600)' : 'var(--error-600)',
            color: '#fff',
            padding: '14px 20px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 14,
            fontWeight: 500,
            zIndex: 1000,
            animation: 'slideUp 0.3s ease',
          }}
        >
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          {toast.message}
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .report-page { box-shadow: none !important; border: none !important; }
        }
      `}</style>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  border: '2px solid var(--neutral-200)',
  borderRadius: 'var(--radius-md)',
  fontSize: 15,
  outline: 'none',
  background: '#fff',
}

function StatCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 'var(--radius-lg)',
        padding: 24,
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--neutral-200)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 'var(--radius-md)',
          background: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <BookOpen size={26} color={color} />
      </div>
      <div>
        <p style={{ fontSize: 14, color: 'var(--neutral-500)' }}>{label}</p>
        <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--neutral-900)' }}>{value}</p>
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 18px',
        borderRadius: 'var(--radius-md)',
        fontSize: 14,
        fontWeight: 500,
        background: active ? 'var(--primary-600)' : '#fff',
        color: active ? '#fff' : 'var(--neutral-600)',
        border: '2px solid ' + (active ? 'var(--primary-600)' : 'var(--neutral-200)'),
      }}
    >
      {icon}
      {children}
    </button>
  )
}

function BookGrid({
  books,
  onIssue,
  onReturn,
  onDelete,
}: {
  books: Book[]
  onIssue: (book: Book) => void
  onReturn: (book: Book) => void
  onDelete: (book: Book) => void
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 16,
      }}
    >
      {books.map((book) => (
        <BookCard key={book.id} book={book} onIssue={onIssue} onReturn={onReturn} onDelete={onDelete} />
      ))}
    </div>
  )
}

function BookCard({
  book,
  onIssue,
  onReturn,
  onDelete,
}: {
  book: Book
  onIssue: (book: Book) => void
  onReturn: (book: Book) => void
  onDelete: (book: Book) => void
}) {
  const isAvailable = book.status === 'Available'
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 'var(--radius-lg)',
        padding: 20,
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--neutral-200)',
        transition: 'all var(--transition)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--radius-md)',
            background: isAvailable ? 'var(--success-50)' : 'var(--warning-50)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <BookOpen size={22} color={isAvailable ? 'var(--success-600)' : 'var(--warning-600)'} />
        </div>
        <span
          style={{
            padding: '4px 12px',
            borderRadius: 100,
            fontSize: 12,
            fontWeight: 600,
            background: isAvailable ? 'var(--success-100)' : 'var(--warning-100)',
            color: isAvailable ? 'var(--success-700)' : 'var(--warning-700)',
          }}
        >
          {book.status}
        </span>
      </div>

      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6, color: 'var(--neutral-900)' }}>{book.name}</h3>
      <p style={{ fontSize: 14, color: 'var(--neutral-500)', marginBottom: 4 }}>by {book.author}</p>
      <p style={{ fontSize: 13, color: 'var(--neutral-400)', marginBottom: 16 }}>ID: {book.book_id}</p>

      {book.issued_to && (
        <p style={{ fontSize: 13, color: 'var(--warning-600)', marginBottom: 16, fontWeight: 500 }}>
          Issued to: {book.issued_to}
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {isAvailable ? (
          <ActionButton
            color="var(--primary-600)"
            bg="var(--primary-50)"
            onClick={() => onIssue(book)}
            icon={<ArrowUpRight size={16} />}
          >
            Issue
          </ActionButton>
        ) : (
          <ActionButton
            color="var(--success-600)"
            bg="var(--success-50)"
            onClick={() => onReturn(book)}
            icon={<ArrowDownLeft size={16} />}
          >
            Return
          </ActionButton>
        )}
        <ActionButton
          color="var(--error-600)"
          bg="var(--error-50)"
          onClick={() => onDelete(book)}
          icon={<Trash2 size={16} />}
        >
          Delete
        </ActionButton>
      </div>
    </div>
  )
}

function ActionButton({
  color,
  bg,
  onClick,
  icon,
  children,
}: {
  color: string
  bg: string
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 14px',
        borderRadius: 'var(--radius-sm)',
        fontSize: 13,
        fontWeight: 500,
        background: bg,
        color: color,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
    >
      {icon}
      {children}
    </button>
  )
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 'var(--radius-xl)',
          padding: 28,
          maxWidth: 480,
          width: '100%',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'var(--neutral-100)',
              borderRadius: 'var(--radius-sm)',
              padding: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--neutral-500)',
            }}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'var(--neutral-700)', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function ModalActions({
  onConfirm,
  onCancel,
  confirmLabel,
  danger,
}: {
  onConfirm: () => void
  onCancel: () => void
  confirmLabel: string
  danger?: boolean
}) {
  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
      <button
        onClick={onCancel}
        style={{
          flex: 1,
          padding: '12px 20px',
          borderRadius: 'var(--radius-md)',
          fontSize: 14,
          fontWeight: 500,
          background: 'var(--neutral-100)',
          color: 'var(--neutral-700)',
        }}
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        style={{
          flex: 1,
          padding: '12px 20px',
          borderRadius: 'var(--radius-md)',
          fontSize: 14,
          fontWeight: 500,
          background: danger ? 'var(--error-600)' : 'var(--primary-600)',
          color: '#fff',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = danger ? 'var(--error-700)' : 'var(--primary-700)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = danger ? 'var(--error-600)' : 'var(--primary-600)')}
      >
        {confirmLabel}
      </button>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--neutral-400)' }}>
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'var(--neutral-100)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}
      >
        <BookOpen size={36} style={{ opacity: 0.4 }} />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--neutral-600)', marginBottom: 8 }}>
        No books yet
      </h3>
      <p style={{ fontSize: 14 }}>Click "Add Book" to add your first book to the library</p>
    </div>
  )
}

// ===================== PROJECT REPORT =====================

function ProjectReport() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 60px' }}>
      {/* Print Button */}
      <div className="no-print" style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => window.print()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--primary-600)',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: 'var(--radius-md)',
            fontSize: 14,
            fontWeight: 600,
            boxShadow: 'var(--shadow-md)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--primary-700)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--primary-600)')}
        >
          <Printer size={18} />
          Print / Save as PDF
        </button>
      </div>

      {/* Report Page */}
      <div
        className="report-page"
        style={{
          background: '#fff',
          borderRadius: 'var(--radius-lg)',
          padding: 48,
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--neutral-200)',
        }}
      >
        {/* Cover */}
        <div style={{ textAlign: 'center', marginBottom: 48, paddingBottom: 32, borderBottom: '3px solid var(--primary-600)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72, borderRadius: '50%', background: 'var(--primary-50)', marginBottom: 20 }}>
            <Library size={36} color="var(--primary-600)" />
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--neutral-900)', marginBottom: 8 }}>
            Library Management System
          </h1>
          <p style={{ fontSize: 16, color: 'var(--neutral-500)' }}>Python Programming Mini Project</p>
          <p style={{ fontSize: 14, color: 'var(--neutral-400)', marginTop: 16 }}>
            Submitted as part of Python Programming Course
          </p>
        </div>

        {/* 1. Introduction */}
        <ReportSection number="1" title="Introduction">
          <p>
            The <strong>Library Management System</strong> is a console-based Python application designed to
            manage the day-to-day operations of a library. It allows a librarian to add new books, view all
            books, search for a book by its ID, issue a book to a student, return an issued book, and delete
            a book record. The system uses a simple in-memory data structure (a list of dictionaries) to store
            book records and provides a menu-driven interface for easy interaction.
          </p>
        </ReportSection>

        {/* 2. Objectives */}
        <ReportSection number="2" title="Objectives">
          <ul style={{ paddingLeft: 20 }}>
            <li>To create a simple and user-friendly system for managing library books.</li>
            <li>To perform CRUD operations (Create, Read, Update, Delete) on book records.</li>
            <li>To track the issue and return status of each book.</li>
            <li>To search for books efficiently by Book ID.</li>
            <li>To demonstrate the use of Python data structures, functions, loops, and conditionals.</li>
          </ul>
        </ReportSection>

        {/* 3. Tools & Technologies */}
        <ReportSection number="3" title="Tools and Technologies Used">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'var(--neutral-100)' }}>
                <th style={{ textAlign: 'left', padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>Tool / Technology</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>Python 3</td>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>Core programming language</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>VS Code</td>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>Code editor / IDE</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>Python Standard Library</td>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>Built-in functions (input, print, etc.)</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>Console / Terminal</td>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>Input and output interface</td>
              </tr>
            </tbody>
          </table>
        </ReportSection>

        {/* 4. Data Structures Used */}
        <ReportSection number="4" title="Data Structures Used">
          <p><strong>1. List (books):</strong> A Python list named <code>books</code> is used as the main data storage. It holds all book records in memory.</p>
          <CodeBlock>{`books = []`}</CodeBlock>
          <p style={{ marginTop: 12 }}><strong>2. Dictionary (book):</strong> Each book is stored as a dictionary with the following keys:</p>
          <CodeBlock>{`book = {
    "id": book_id,
    "name": book_name,
    "author": author,
    "status": "Available"
}`}</CodeBlock>
          <ul style={{ paddingLeft: 20, marginTop: 12 }}>
            <li><code>"id"</code> — unique identifier for the book (string)</li>
            <li><code>"name"</code> — title of the book (string)</li>
            <li><code>"author"</code> — author of the book (string)</li>
            <li><code>"status"</code> — current status: "Available" or "Issued" (string)</li>
          </ul>
        </ReportSection>

        {/* 5. Functions */}
        <ReportSection number="5" title="Functions Implemented">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'var(--neutral-100)' }}>
                <th style={{ textAlign: 'left', padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>Function Name</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)', fontFamily: 'monospace' }}>add_book()</td>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>Takes Book ID, Name, and Author as input, creates a dictionary, and appends it to the books list.</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)', fontFamily: 'monospace' }}>view_books()</td>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>Displays all books in the system with their details (ID, Name, Author, Status).</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)', fontFamily: 'monospace' }}>search_book()</td>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>Searches for a book by Book ID and displays its details if found.</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)', fontFamily: 'monospace' }}>issue_book()</td>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>Issues a book to a student by changing its status from "Available" to "Issued" and recording the student name.</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)', fontFamily: 'monospace' }}>return_book()</td>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>Returns an issued book by changing its status back to "Available".</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)', fontFamily: 'monospace' }}>delete_book()</td>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>Removes a book record from the books list by Book ID.</td>
              </tr>
            </tbody>
          </table>
        </ReportSection>

        {/* 6. Algorithm / Flow of Control */}
        <ReportSection number="6" title="Algorithm / Flow of Control">
          <p>The program uses a <strong>menu-driven approach</strong> with an infinite while loop:</p>
          <ol style={{ paddingLeft: 20, marginTop: 12 }}>
            <li>Display the main menu with 7 options.</li>
            <li>Accept the user's choice via <code>input()</code>.</li>
            <li>Based on the choice (1-7), call the corresponding function:
              <ul style={{ paddingLeft: 20, marginTop: 8 }}>
                <li>Choice 1 → <code>add_book()</code></li>
                <li>Choice 2 → <code>view_books()</code></li>
                <li>Choice 3 → <code>search_book()</code></li>
                <li>Choice 4 → <code>issue_book()</code></li>
                <li>Choice 5 → <code>return_book()</code></li>
                <li>Choice 6 → <code>delete_book()</code></li>
                <li>Choice 7 → Exit the program (<code>break</code>)</li>
              </ul>
            </li>
            <li>If the choice is invalid, display an error message.</li>
            <li>Repeat from step 1 until the user chooses to exit.</li>
          </ol>
        </ReportSection>

        {/* 7. Python Concepts Used */}
        <ReportSection number="7" title="Python Concepts Used">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'var(--neutral-100)' }}>
                <th style={{ textAlign: 'left', padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>Concept</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>Where Used</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>Variables</td>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>books, book_id, book_name, author, choice, etc.</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>Lists</td>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>books list to store all book records</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>Dictionaries</td>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>Each book stored as a dictionary with keys: id, name, author, status</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>Functions</td>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>add_book(), view_books(), search_book(), issue_book(), return_book(), delete_book()</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>Loops</td>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>while loop (main menu), for loop (iterating books list)</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>Conditionals</td>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>if-elif-else statements for menu choice and status checks</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>Input/Output</td>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>input() for user input, print() for output</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>List Methods</td>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>append() to add books, remove() to delete books</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>Break Statement</td>
                <td style={{ padding: '10px 14px', border: '1px solid var(--neutral-300)' }}>Used to exit the while loop when user selects option 7</td>
              </tr>
            </tbody>
          </table>
        </ReportSection>

        {/* 8. Source Code */}
        <ReportSection number="8" title="Source Code">
          <CodeBlock>{`books = []

def add_book():
    book_id = input("Enter Book ID: ")
    book_name = input("Enter Book Name: ")
    author = input("Enter Author Name: ")

    book = {
        "id": book_id,
        "name": book_name,
        "author": author,
        "status": "Available"
    }
    books.append(book)
    print("\\nBook added successfully!")

def view_books():
    if len(books) == 0:
        print("\\nNo books available.")
        return

    print("\\n========== ALL BOOKS ==========")
    for book in books:
        print("Book ID :", book["id"])
        print("Name    :", book["name"])
        print("Author  :", book["author"])
        print("Status  :", book["status"])
        print("------------------------------")

def search_book():
    search_id = input("Enter Book ID to search: ")
    for book in books:
        if book["id"] == search_id:
            print("\\nBook Found!")
            print("Book ID :", book["id"])
            print("Name    :", book["name"])
            print("Author  :", book["author"])
            print("Status  :", book["status"])
            return
    print("\\nBook not found.")

def issue_book():
    book_id = input("Enter Book ID to issue: ")
    for book in books:
        if book["id"] == book_id:
            if book["status"] == "Available":
                student_name = input("Enter Student Name: ")
                book["status"] = "Issued"
                print("\\nBook issued successfully!")
                print("Issued to:", student_name)
            else:
                print("\\nBook is already issued.")
            return
    print("\\nBook not found.")

def return_book():
    book_id = input("Enter Book ID to return: ")
    for book in books:
        if book["id"] == book_id:
            if book["status"] == "Issued":
                book["status"] = "Available"
                print("\\nBook returned successfully!")
            else:
                print("\\nThis book was not issued.")
            return
    print("\\nBook not found.")

def delete_book():
    book_id = input("Enter Book ID to delete: ")
    for book in books:
        if book["id"] == book_id:
            books.remove(book)
            print("\\nBook deleted successfully!")
            return
    print("\\nBook not found.")

while True:
    print("\\n================================")
    print("   LIBRARY MANAGEMENT SYSTEM")
    print("================================")
    print("1. Add Book")
    print("2. View Books")
    print("3. Search Book")
    print("4. Issue Book")
    print("5. Return Book")
    print("6. Delete Book")
    print("7. Exit")

    choice = input("\\nEnter your choice: ")

    if choice == "1":
        add_book()
    elif choice == "2":
        view_books()
    elif choice == "3":
        search_book()
    elif choice == "4":
        issue_book()
    elif choice == "5":
        return_book()
    elif choice == "6":
        delete_book()
    elif choice == "7":
        print("\\nThank you for using Library Management System!")
        break
    else:
        print("\\nInvalid choice! Please try again.")`}</CodeBlock>
        </ReportSection>

        {/* 9. Sample Output */}
        <ReportSection number="9" title="Sample Output">
          <CodeBlock>{`================================
   LIBRARY MANAGEMENT SYSTEM
================================
1. Add Book
2. View Books
3. Search Book
4. Issue Book
5. Return Book
6. Delete Book
7. Exit

Enter your choice: 1
Enter Book ID: B001
Enter Book Name: Python Programming
Enter Author Name: John Smith

Book added successfully!

================================
   LIBRARY MANAGEMENT SYSTEM
================================
1. Add Book
2. View Books
3. Search Book
4. Issue Book
5. Return Book
6. Delete Book
7. Exit

Enter your choice: 2

========== ALL BOOKS ==========
Book ID : B001
Name    : Python Programming
Author  : John Smith
Status  : Available
------------------------------

================================
   LIBRARY MANAGEMENT SYSTEM
================================
1. Add Book
2. View Books
3. Search Book
4. Issue Book
5. Return Book
6. Delete Book
7. Exit

Enter your choice: 4
Enter Book ID to issue: B001
Enter Student Name: Alice

Book issued successfully!
Issued to: Alice`}</CodeBlock>
        </ReportSection>

        {/* 10. Conclusion */}
        <ReportSection number="10" title="Conclusion">
          <p>
            The Library Management System successfully demonstrates the practical application of core Python
            programming concepts including functions, lists, dictionaries, loops, and conditional statements.
            The system provides a clean, menu-driven interface that makes it easy to manage library operations
            such as adding, viewing, searching, issuing, returning, and deleting books. This project can be
            further extended by adding features like a database for permanent storage, a graphical user
            interface (GUI) using Tkinter, user authentication, and fine calculation for late returns.
          </p>
        </ReportSection>

        {/* 11. Future Enhancements */}
        <ReportSection number="11" title="Future Enhancements">
          <ul style={{ paddingLeft: 20 }}>
            <li>Add a database (e.g., SQLite or PostgreSQL) for permanent data storage.</li>
            <li>Develop a graphical user interface (GUI) using Tkinter or PyQt.</li>
            <li>Add user login and authentication for librarians.</li>
            <li>Implement fine calculation for late book returns.</li>
            <li>Add categories and tags for better book organization.</li>
            <li>Generate reports and statistics about issued and available books.</li>
          </ul>
        </ReportSection>
      </div>
    </div>
  )
}

function ReportSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--primary-700)',
          marginBottom: 16,
          paddingBottom: 8,
          borderBottom: '2px solid var(--neutral-200)',
        }}
      >
        {number}. {title}
      </h2>
      <div style={{ fontSize: 15, color: 'var(--neutral-700)', lineHeight: 1.7 }}>{children}</div>
    </div>
  )
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre
      style={{
        background: 'var(--neutral-900)',
        color: '#e5e7eb',
        padding: 20,
        borderRadius: 'var(--radius-md)',
        fontSize: 13,
        lineHeight: 1.6,
        overflow: 'auto',
        fontFamily: "'Courier New', monospace",
        marginTop: 12,
      }}
    >
      <code>{children}</code>
    </pre>
  )
}
