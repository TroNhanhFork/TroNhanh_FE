import React, { useState } from 'react';

export default function SearchBar({ onSearch }) {
  const [district, setDistrict] = useState('');
  const [street, setStreet] = useState('');
  const [facilities, setFacilities] = useState('');

  const handleSearch = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ district, street, facilities }),
      });

      const data = await response.json();
      console.log('Search result:', data);

      // Truyền dữ liệu về component cha (HeroSection)
      if (onSearch) {
        onSearch(data);
      }
    } catch (err) {
      console.error('Error Searching:', err);
    }
  };

  return (
    <div className="search-box container">
      <div className="row align-items-center">
        <div className="col-md-3 mb-2 mb-md-0">
          <select
            className="form-select"
            name="district"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          >
            <option value="">Select district</option>
            <option>Liên Chiểu</option>
            <option>Hải Châu</option>
            <option>Thanh Khê</option>
            <option>Cẩm Lệ</option>
            <option>Sơn Trà</option>
            <option>Ngũ Hành Sơn</option>
          </select>
        </div>
        <div className="col-md-3 mb-2 mb-md-0">
          <input
            type="text"
            className="form-control"
            placeholder="Name street"
            name="street"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
          />
        </div>
        <div className="col-md-4 mb-2 mb-md-0">
          <input
            type="text"
            className="form-control"
            placeholder="Nearby facilities (mart, convenience stores, etc.)"
            name="facilities"
            value={facilities}
            onChange={(e) => setFacilities(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <button className="btn btn-dark w-100" onClick={handleSearch}>
            Search
          </button>
        </div>
      </div>
    </div>
  );
}
