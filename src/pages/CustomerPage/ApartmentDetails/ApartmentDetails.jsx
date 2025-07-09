import { useParams, useNavigate } from "react-router-dom";
import { Row, Col, Button, DatePicker, Input, Divider, Carousel, Card, Avatar } from "antd";
import { UserOutlined, CalendarOutlined, HeartOutlined, HeartFilled, LeftOutlined, RightOutlined } from "@ant-design/icons";
import { getAccommodationById, addToFavorite } from '../../../services/accommodationAPI'
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./ApartmentDetails.css";
import { useEffect, useState, useRef } from "react";
import useUser from "../../../contexts/UserContext"
import RoommatePostModal from './RoommatePostModal';
import { getRoommatePosts } from '../../../services/roommateAPI';
import Slider from "react-slick";


const PropertyDetails = () => {
  const { id } = useParams();
  const [property, setProperty] = useState()
  const [isFavorite, setIsFavorite] = useState(false)
  const { user } = useUser()
  const [showModal, setShowModal] = useState(false);
  const [roommatePosts, setRoommatePosts] = useState([]);
  const sliderRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAccommodationById(id)
        const position = [
          parseFloat(data.location.latitude),
          parseFloat(data.location.longitude),
        ];
        setProperty({ ...data, position })
      } catch (error) {
        console.log("No Accommodation found!")
      }
    }
    fetchData()
  }, [id])


  const fetchRoommates = async () => {
    if (property?._id) {
      try {
        const posts = await getRoommatePosts(property._id);
        setRoommatePosts(posts);
      } catch (err) {
        console.log('Failed to load roommate posts', err);
      }
    }
  };

  useEffect(() => {
    fetchRoommates();
  }, [property?._id]);

  const navigate = useNavigate();

  if (!property) {
    return <div className="property-not-found">Property not found.</div>;
  }

  const toggleFavorite = async () => {
    if (!user) {
      alert("Please log in to favorite this property.");
      return;
    }
    setIsFavorite(prev => !prev)

    try {
      await addToFavorite({
        accommodationId: property._id
      })
      console.log('Added to favorite!')
    } catch (error) {
      console.log('Failed to add to favorite', error)
    }
  }



  const handleContinueBooking = () => {
    navigate("/customer/checkout");
  };

  const sliderSettings = {
    dots: false,
    infinite: roommatePosts.length > 3,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 2 }
      },
      {
        breakpoint: 768,
        settings: { slidesToShow: 1 }
      }
    ]
  };

  return (
    <div>
      {property && (
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <div className="property-main-image-wrapper">
              <img
                src={property.photos && property.photos.length > 0
                  ? `http://localhost:5000${property.photos[0]}`
                  : "/image/default-image.jpg"}
                alt="property main"
                className="property-main-image"
              />
              <button className="favorite-btn" onClick={toggleFavorite}>
                {isFavorite ? (
                  <HeartFilled style={{ color: "red", fontSize: 24 }} />
                ) : (
                  <HeartOutlined style={{ color: "black", fontSize: 24 }} />
                )}
              </button>
            </div>
          </Col>
        </Row>
      )}
      <Row gutter={32} className="property-main-content">
        <Col xs={24} md={16}>
          <h1 className="property-title">{property.title}</h1>
          <p className="property-location">
            {[property.location?.street, property.location?.district, property.location?.addressDetail,]
              .filter(Boolean)
              .join(", ")}
          </p>

          <div className="property-summary">
            {Array.isArray(property.summary) &&
              property.summary.map((item, idx) => (
                <span key={idx}>{item}</span>
              ))}

          </div>

          <h2>Description</h2>
          <p>{property.description}</p>

          <h3>In sed</h3>
          <p>
            In nullam eget urna suspendisse odio nunc. Eu sodales vestibulum,
            donec rutrum justo, amet porttitor vitae.
          </p>

          <h3>Adipiscing risus, fermentum</h3>
          <p>
            Laoreet risus accumsan pellentesque lacus, in nulla eu elementum.
            Mollis enim fringilla aenean diam tellus diam.
          </p>
        </Col>

        <Col xs={24} md={8}>
          <div className="booking-card">
            <h2 className="booking-price">£{property.price} / Month</h2>

            <div className="booking-dates">
              <DatePicker
                placeholder="Move in"
                suffixIcon={<CalendarOutlined />}
              />
              <DatePicker
                placeholder="Move out"
                suffixIcon={<CalendarOutlined />}
              />
            </div>

            <div className="booking-guests">
              <UserOutlined />
              <Input type="number" placeholder="Guests" defaultValue={1} />
            </div>

            <p>All utilities are included</p>
            <Divider />

            <div className="booking-costs">
              <div className="cost-row">
                <span>Average monthly rent</span>
                <span>£{(property.price * 0.93).toFixed(2)}</span>
              </div>
              <div className="cost-row">
                <span>Pay upon booking</span>
                <span>£{(property.price * 0.9998).toFixed(2)}</span>
              </div>
              <div className="cost-row total-cost">
                <span>Total costs</span>
                <span>£{(property.price * 1.003).toFixed(2)}</span>
              </div>
            </div>

            <Button className="booking-button" onClick={handleContinueBooking}>
              Continue booking
            </Button>
            <p className="booking-note">
              When you book this apartment, your reservation will be confirmed
              instantly.
            </p>
          </div>
        </Col>
      </Row>
      <Divider />
      <h1 className="text-heading">Amenities</h1>
      <Row gutter={[24, 24]} className="property-amenities">
        {property.amenities?.map((item, index) => (
          <Col xs={12} sm={8} md={6} key={index} className="amenity-item">
            <i className={`bi ${item.icon} amenity-icon`}></i>
            <div>
              <strong>{item.name}</strong>
              {item.note && <div className="amenity-note">{item.note}</div>}
            </div>
          </Col>
        ))}
      </Row>
      <Divider />
      <h1 className="text-heading">Neighbourhood</h1>
      <p>
        Ultricies etiam sit auctor aenean donec nunc, elementum etiam nisl. Sed
        arcu, sed elit egestas faucibus pellentesque. Morbi faucibus faucibus
        nam volutpat arcu lorem pharetra a. Pretium dolor nunc, dolor elit
        lectus sit amet sit. Elit enim mi ornare id ultricies accumsan proin
        amet.
      </p>
      Molestie amet, pretium eu massa a, pharetra.Tellus quisque sollicitudin
      tristique maecenas vitae fames eget ut.Nisl commodo lacinia ultrices ut
      odio dui at.Adipiscing ac auctor hac urna dictum.Urna quis enim lobortis
      vel dignissim sed posuere.Semper lectus neque leo mollis pellentesque
      auctor pharetra, sed.Varius facilisis in sem tristique.Mauris
      condimentum pellentesque non commodo, quisque eget dolor.Et ultrices id
      placerat accumsan.Consectetur consectetur libero orci dolor dolor
      sagittis.Leo, augue sit sem adipiscing purus ut at malesuada.Dolor, eu
      dignissim adipiscing eget sed metus.
      < p ></p >
      <Divider />
      <h1 className="text-heading">Location</h1>
      <div className="map-container">
        <MapContainer
          center={[property.location.latitude, property.location.longitude]}
          zoom={14}
          scrollWheelZoom={false}
          className="map-leaflet"
        >
          <TileLayer
            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {property.position ? (
            <Marker key={property._id} position={property.position}>
              <Popup>{property.title}</Popup>
            </Marker>
          ) : null};
        </MapContainer>
      </div>

      <Divider />
      <h1 className="text-heading">Looking for Roommates</h1>

      <Button onClick={() => setShowModal(true)} type="primary" style={{ marginBottom: '1rem' }}>
        + Create Roommate Post
      </Button>

      {roommatePosts.length === 0 ? (
        <p>No roommate posts yet.</p>
      ) : (
        <div style={{ position: 'relative' }}>
          <Slider {...sliderSettings} ref={sliderRef}>
            {roommatePosts.map((post) => (
              <div key={post._id} style={{ padding: "0 10px" }}>
                <Card className="roommate-card" hoverable>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                    <Avatar
                      src={
                        post.userId?.avatar
                          ? `http://localhost:5000${post.userId?.avatar}`
                          : "/default-avatar.png"
                      }
                      size={48}
                      style={{ marginRight: 12 }}
                    />



                    <div>
                      <h3 style={{ margin: 0 }}>{ post.userId?.name || "Unknown"}</h3>
                      <small>{post.createdAt?.slice(0, 10)}</small>
                    </div>
                  </div>

                  {post.images?.length > 0 && (
                    <Carousel autoplay>
                      {post.images.map((img, idx) => (
                        <div key={idx}>
                          <img
                            src={img}
                            alt={`post-${idx}`}
                            style={{
                              width: "100%",
                              height: 200,
                              objectFit: "cover",
                              borderRadius: 8,
                              marginBottom: 12
                            }}
                          />
                        </div>
                      ))}
                    </Carousel>
                  )}

                  <p>{post.intro}</p>
                  <p>
                    <strong>Habits:</strong> {post.habits?.join(", ") || "Not specified"}
                  </p>
                </Card>
              </div>
            ))}
          </Slider>

          {/* Custom Buttons */}
          <div className="custom-carousel-buttons">
            <button className="nav-button" onClick={() => sliderRef.current.slickPrev()}>
              <LeftOutlined />
            </button>
            <button className="nav-button" onClick={() => sliderRef.current.slickNext()}>
              <RightOutlined />
            </button>
          </div>
        </div>
      )}

      <RoommatePostModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        accommodationId={property._id}
        onSuccess={fetchRoommates}
      />

      <Divider />
      <h1 className="text-heading">Policy detail</h1>
      <Row gutter={[32, 32]} justify="center">
        <Col xs={24} md={8}>
          <h3>House rules</h3>
          <ul className="policy-list">
            <li>
              <i className="bi bi-clock-fill" /> Checkin time
            </li>
            <li>
              <i className="bi bi-clock-fill" /> Checkout time
            </li>
            <li>
              <i className="bi bi-x-circle" /> No smoking
            </li>
            <li>
              <i className="bi bi-slash-circle" /> No pets
            </li>
            <li>
              <i className="bi bi-ban" /> No parties or events
            </li>
          </ul>
        </Col>

        <Col xs={24} md={8}>
          <h3>Cancellation Policy</h3>
          <ul className="policy-list">
            <li>
              <i className="bi bi-dot" /> Free cancellation up to 24hrs before
              checkin
            </li>
          </ul>
        </Col>

        <Col xs={24} md={8}>
          <h3>Health & Safety</h3>
          <ul className="policy-list">
            <li>
              <i className="bi bi-shield-check" /> Cleaner follows COVID policy
            </li>
          </ul>
        </Col>
      </Row>
    </div >
  );
};

export default PropertyDetails;
