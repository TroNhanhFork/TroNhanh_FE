import { useEffect, useState } from "react";
import { Row, Col } from "antd";
import { useLocation } from "react-router-dom";
import Filters from "./components/Filters";
import PropertyList from "./components/PropertyList";
import MapView from "./components/MapView";
import FAQ from "./components/FAQ";
import { searchBoardingHouses, getAllBoardingHouses } from "../../../services/boardingHouseAPI";

const ApartmentSearch = () => {
  const [filteredData, setFilteredData] = useState([]);
  const location = useLocation();

  const fetchAndMap = async (searchFn) => {
    try {
      const data = await searchFn();
      const mapData = data.map((item) => ({
        ...item,
        position: [
          parseFloat(item.location.latitude),
          parseFloat(item.location.longitude),
        ],
      }));
      setFilteredData(mapData);
    } catch (error) {
      console.error("Failed to fetch accommodations:", error);
    }
  };

  useEffect(() => {
    if (location.state) {
      const filters = location.state;
      fetchAndMap(() => searchBoardingHouses(filters));
    } else {
      fetchAndMap(getAllBoardingHouses);
    }
  }, [location.state]);

  const handleSearch = async (filters) => {
    fetchAndMap(() => searchBoardingHouses(filters));
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
