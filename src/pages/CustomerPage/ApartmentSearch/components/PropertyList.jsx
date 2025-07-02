import { useState } from "react";
import { Button, Card } from "antd";
import { useNavigate } from "react-router-dom";
import PropertyCard from "./PropertyCard";
import { propertySampleData } from "../../../../seeders/propertySampleData";

const PropertyList = ({ data }) => {
  const navigate = useNavigate();
  const [visibleCount] = useState(7); // show 7

  const handleShowMore = () => {
    navigate("/customer/apartments");
  };
  // Nếu không có data
  if (!data || data.length === 0) {
    return (
      <div>
        <p>No results found</p>
        {/* Optional: render mẫu khi chưa có search */}
        {propertySampleData.slice(0, visibleCount).map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    );
  }

  // Nếu có data từ BE
  return (
    <div>
      {data.map((item) => (
        <Card key={item._id} title={item.title}>
          <p>{item.location?.street}, {item.location?.district}</p>
          <p>Price: {item.price}</p>
        </Card>
      ))}

      <div style={{ marginTop: "35px", textAlign: "center" }}>
        <Button
          style={{
            backgroundColor: "#49735A",
            color: "#fff",
            padding: "10px 24px",
            fontSize: "16px",
            borderRadius: "8px",
            border: "none",
          }}
          onClick={handleShowMore}
        >
          Show more apartments
        </Button>
      </div>
    </div>
  );
};


export default PropertyList;
