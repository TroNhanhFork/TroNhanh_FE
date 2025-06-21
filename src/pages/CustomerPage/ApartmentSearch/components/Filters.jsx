import { useState } from "react";
import {
  InputNumber,
  DatePicker,
  Button,
  Select,
  Dropdown,
  Menu,
  Checkbox,
  Space,
  notification,
} from "antd";
import {
  DownOutlined,
  SearchOutlined,
  UserOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

const Filters = () => {
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedBedrooms, setSelectedBedrooms] = useState(null);
  const [selectedBathrooms, setSelectedBathrooms] = useState(null);
  const [features, setFeatures] = useState({
    disabledAccess: false,
    parking: false,
    elevator: false,
    washingMachine: false,
  });
  const [moveInDate, setMoveInDate] = useState(null);
  const [moveOutDate, setMoveOutDate] = useState(null);
  const [guestCount, setGuestCount] = useState("");
  const [errors, setErrors] = useState({});

  const cityOptions = [
    { label: "Thua Thien - Hue", value: "Thua Thien - Hue" },
    { label: "Danang", value: "Danang" },
    { label: "Quang Nam", value: "Quang Nam" },
  ];

  const handleSearch = () => {
    const newErrors = {};

    if (!selectedCity) newErrors.city = "City is required";
    if (!moveInDate) newErrors.moveIn = "Move-in date is required";
    if (!moveOutDate) newErrors.moveOut = "Move-out date is required";
    if (!guestCount || isNaN(guestCount) || parseInt(guestCount) < 1)
      newErrors.guests = "Please enter a valid number of guests";

    if (moveInDate && moveOutDate && moveInDate.isAfter(moveOutDate)) {
      newErrors.dateRange = "Move-in must be before move-out";
    }

    if (Object.keys(newErrors).length > 0) {
      // Show all errors in one notification
      notification.error({
        message: "Search Validation Failed",
        description: Object.values(newErrors).join(". "),
        duration: 4,
      });
      return;
    }

    // If no errors, continue with search
    console.log("Valid filters:", {
      selectedCity,
      moveInDate,
      moveOutDate,
      guestCount,
      selectedBedrooms,
      selectedBathrooms,
      features,
    });
  };

  const handleFeatureChange = (featureName, checked) => {
    setFeatures((prev) => ({
      ...prev,
      [featureName]: checked,
    }));
  };

  const moreFiltersMenu = (
    <Menu>
      <Menu.Item key="bedrooms" disabled>
        <strong>Bedrooms</strong>
      </Menu.Item>
      <Menu.Item key="bedroom-select" style={{ padding: 8 }}>
        <Select
          style={{ width: "100%" }}
          placeholder="Select Bedrooms"
          value={selectedBedrooms}
          onChange={setSelectedBedrooms}
        >
          <Select.Option value="studio">Studio</Select.Option>
          <Select.Option value="1">1</Select.Option>
          <Select.Option value="2">2</Select.Option>
          <Select.Option value="3">3</Select.Option>
        </Select>
      </Menu.Item>

      <Menu.Divider />

      <Menu.Item key="bathrooms" disabled>
        <strong>Bathrooms</strong>
      </Menu.Item>
      <Menu.Item key="bathroom-select" style={{ padding: 8 }}>
        <Select
          style={{ width: "100%" }}
          placeholder="Select Bathrooms"
          value={selectedBathrooms}
          onChange={setSelectedBathrooms}
        >
          <Select.Option value="1">1</Select.Option>
          <Select.Option value="2">2</Select.Option>
          <Select.Option value="3">3</Select.Option>
        </Select>
      </Menu.Item>

      <Menu.Divider />

      <Menu.Item key="features" disabled>
        <strong>Features</strong>
      </Menu.Item>
      <Menu.Item key="features-checkboxes" style={{ padding: 8 }}>
        <Space direction="vertical">
          <Checkbox
            checked={features.disabledAccess}
            onChange={(e) =>
              handleFeatureChange("disabledAccess", e.target.checked)
            }
          >
            Disabled accesses
          </Checkbox>
          <Checkbox
            checked={features.parking}
            onChange={(e) => handleFeatureChange("parking", e.target.checked)}
          >
            Parking
          </Checkbox>
          <Checkbox
            checked={features.elevator}
            onChange={(e) => handleFeatureChange("elevator", e.target.checked)}
          >
            Elevator
          </Checkbox>
          <Checkbox
            checked={features.washingMachine}
            onChange={(e) =>
              handleFeatureChange("washingMachine", e.target.checked)
            }
          >
            Washing machine
          </Checkbox>
        </Space>
      </Menu.Item>
    </Menu>
  );

  return (
    <div style={{ padding: "24px 16px" }}>
      {/* Search Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          border: "2px solid #004d47",
          borderRadius: "40px",
          overflow: "hidden",
          padding: "4px",
          flexWrap: "wrap",
        }}
      >
        {/* City */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "8px 16px",
            flex: "1",
            minWidth: "150px",
            borderRight: "1px solid #004d47",
          }}
        >
          <SearchOutlined style={{ marginRight: 8 }} />
          <Select
            placeholder="Select a city"
            style={{ flex: 1 }}
            bordered={false}
            options={cityOptions}
            value={selectedCity}
            onChange={setSelectedCity}
          />
        </div>

        {/* Move-in */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "8px 16px",
            flex: "1",
            minWidth: "150px",
            borderRight: "1px solid #004d47",
          }}
        >
          <CalendarOutlined style={{ marginRight: 8 }} />
          <DatePicker
            placeholder="Move-in"
            style={{ flex: 1 }}
            bordered={false}
            value={moveInDate}
            onChange={setMoveInDate}
          />
        </div>

        {/* Move-out */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "8px 16px",
            flex: "1",
            minWidth: "150px",
            borderRight: "1px solid #004d47",
          }}
        >
          <CalendarOutlined style={{ marginRight: 8 }} />
          <DatePicker
            placeholder="Move-out"
            style={{ flex: 1 }}
            bordered={false}
          />
        </div>

        {/* Guests */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "8px 16px",
            flex: "1",
            minWidth: "120px",
            borderRight: "1px solid #004d47",
          }}
        >
          <UserOutlined style={{ marginRight: 8 }} />
          <InputNumber
            placeholder="Guests"
            min={1}
            style={{ flex: 1 }}
            bordered={false}
            value={guestCount}
            onChange={setGuestCount}
          />
        </div>

        {/* Search button */}
        <div>
          <Button
            type="primary"
            onClick={handleSearch}
            style={{
              backgroundColor: "#004d47",
              color: "#fff",
              borderRadius: "40px",
              height: "100%",
              padding: "12px 24px",
              border: "none",
            }}
          >
            Search
          </Button>
        </div>
      </div>

      {/* Bottom filters */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "16px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        {/* More filters */}
        <Dropdown overlay={moreFiltersMenu} trigger={["click"]}>
          <Button
            style={{
              backgroundColor: "#004d47",
              color: "#fff",
              borderRadius: "40px",
              padding: "10px 24px",
              border: "none",
              fontWeight: "bold",
            }}
          >
            More filters <DownOutlined />
          </Button>
        </Dropdown>

        {/* Result summary */}
        <div style={{ fontSize: "16px" }}>
          <span style={{ fontWeight: "bold" }}>52 results</span> for{" "}
          <span style={{ fontStyle: "italic" }}>
            "1 Bedroom property in West London"
          </span>
        </div>

        {/* Sort by */}
        <div style={{ fontSize: "16px" }}>
          <span style={{ fontWeight: "bold" }}>Sort by: </span>
          <span style={{ color: "#49735A", cursor: "pointer" }}>
            Availability <DownOutlined style={{ fontSize: "12px" }} />
          </span>
        </div>
      </div>
    </div>
  );
};

export default Filters;
