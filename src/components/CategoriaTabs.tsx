interface Props {
  categorias: string[];
  ativa: string;
  onChange: (categoria: string) => void;
}

export default function CategoriaTabs({ categorias, ativa, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onChange('Todos')}
        className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition ${
          ativa === 'Todos'
            ? 'bg-orange-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        Todos
      </button>
      {categorias.map(cat => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition ${
            ativa === cat
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
