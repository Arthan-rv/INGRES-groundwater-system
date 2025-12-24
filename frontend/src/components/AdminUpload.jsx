import { useRef, useState } from 'react';

const AdminUpload = ({ onUpload, isUploading }) => {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      setError('Please provide a CSV file');
      return;
    }
    setError('');
    setFileName(file.name);
    await onUpload(file);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <section className="upload-card">
      <div>
        <h3>Upload groundwater CSV</h3>
        <p className="muted">Columns: region, aquifer, tdsLevel, contaminationRisk, waterLevelMeters</p>
      </div>
      <label className="upload-label">
        <input ref={inputRef} type="file" accept=".csv" onChange={handleFileChange} disabled={isUploading} />
        <span>{isUploading ? 'Uploading…' : fileName || 'Choose CSV file'}</span>
      </label>
      {error && <div className="form-error">{error}</div>}
    </section>
  );
};

export default AdminUpload;

