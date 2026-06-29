export default function DataTable({ columns, rows, renderRow, emptyText }) {
  return (
    <div className="table-responsive pt-4">
      <table className="table table-hover align-middle">
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center text-secondary py-4">
                {emptyText}
              </td>
            </tr>
          ) : rows.map(renderRow)}
        </tbody>
      </table>
    </div>
  );
}
