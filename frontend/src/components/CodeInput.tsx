interface CodeInputProps {
  code: string;
  onChange: (code: string) => void;
  error?: string | null;
}

export function CodeInput({ code, onChange, error }: CodeInputProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-sm font-medium text-gray-300">JSX Code</span>
        <span className="text-xs text-gray-500">Paste your JSX here</span>
      </div>
      <div className="relative flex-1">
        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full h-full p-4 font-mono text-sm bg-gray-900 text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-2 border-red-500' : ''
          }`}
          placeholder={`Paste your JSX code here, e.g.:

<div className="p-4 bg-blue-500">
  <h1 className="text-2xl font-bold">Hello World</h1>
  <p>This is a paragraph</p>
</div>`}
          spellCheck={false}
        />
        {error && (
          <div className="absolute bottom-0 left-0 right-0 px-4 py-2 text-sm text-red-400 bg-red-900/50">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
