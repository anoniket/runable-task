import { WebsiteEditor } from './components/WebsiteEditor';

function App() {
  const handleSave = (serializedComponent: string) => {
    console.log('Component saved:', serializedComponent);
  };

  return (
    <WebsiteEditor
      onSave={handleSave}
      autoSaveDelay={2000}
      enableBackend={true}
    />
  );
}

export default App;
