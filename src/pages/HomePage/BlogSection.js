import React from "react";

const blogData = [
  {
    id: 1,
    image: "blog1.jpg",
    title: "Turpis elit in dictum eget eget",
    description: "Convallis ac eu fames feugiat et venenatis nulla luctus.",
    time: "1 min read",
  },
  {
    id: 2,
    image: "blog2.jpg",
    title: "Faucibus egestas ut sit purus ultricies at eu",
    description:
      "Vivamus tellus risus lacus commodo urna fringilla cursus nulla amet.",
    time: "3 min read",
  },
  {
    id: 3,
    image: "blog3.jpg",
    title: "Feugiat gravida sed sit lacus sagittis",
    description: "Pellentesque ultricies hendrerit lacus lectus.",
    time: "3 min read",
  },
];

const BlogSection = () => {
  return (
    <div className="container py-5">
      <h2 className="text-center fw-bold mb-4">Read our blog</h2>
      <div className="row g-4">
        {blogData.map((item) => (
          <div className="col-md-4" key={item.id}>
            <div className="blog-card h-100">
              <img src={item.image} alt={item.title} className="blog-img" />
              <div className="p-3 text-center">
                <h5 className="fw-semibold">{item.title}</h5>
                <p className="text-muted small mb-2">{item.description}</p>
                <span className="text-dark small">
                  <i className="bi bi-clock me-1"></i>
                  {item.time}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center mt-4">
        <button className="btn btn-dark rounded-pill px-4">Read more</button>
      </div>
    </div>
  );
};

export default BlogSection;
