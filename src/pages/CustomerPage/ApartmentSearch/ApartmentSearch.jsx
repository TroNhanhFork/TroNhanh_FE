import { useState } from "react";
import { Row, Col } from "antd";
import Filters from "./components/Filters";
import PropertyList from "./components/PropertyList";
import MapView from "./components/MapView";
import FAQ from "./components/FAQ";
import { searchAccommodations } from "../../../services/accommodationAPI";

const ApartmentSearch = () => {
  const [filteredData, setFilteredData] = useState([]);

  const handleSearch = async (filters) => {
    try {
      const data = await searchAccommodations(filters);

      const mappedData = data.map((item) => ({
        ...item,
        position: [
          parseFloat(item.location.latitude),
          parseFloat(item.location.longitude),
        ],
      }));

      setFilteredData(mappedData);
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  return (
    <div>
      <Filters onSearch={handleSearch} />
      <Row gutter={16} style={{ padding: 16 }}>
        <Col xs={24} lg={16}>
          <PropertyList data={filteredData} />
        </Col>
        <Col xs={24} lg={8}>
          <div style={{ height: "600px", position: "sticky", top: "100px" }}>
            <MapView properties={filteredData} />
          </div>
        </Col>
      </Row>
      <FAQ />
    </div>
  );
};

export default ApartmentSearch;
