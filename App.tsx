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
