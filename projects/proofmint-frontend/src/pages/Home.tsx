import "../assets/css/home.css";
export const Home = () => {
  return (
    <>
      <h1>How Does NFT'S Work ?</h1>

      <div id="carouselExampleIndicators" className="carousel slide" data-bs-ride="carousel">
        <div className="carousel-indicators">
          <button
            type="button"
            data-bs-target="#carouselExampleIndicators"
            data-bs-slide-to="0"
            className="active"
            aria-current="true"
            aria-label="Slide 1"
          ></button>
          <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="1" aria-label="Slide 2"></button>
          <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="2" aria-label="Slide 3"></button>
          <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="3" aria-label="Slide 4"></button>
          <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="4" aria-label="Slide 5"></button>
          <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="5" aria-label="Slide 6"></button>
        </div>
        <div className="carousel-inner">
          <div className="carousel-item active">
            <img src="./images/How NFTiers Work .gif" className="d-block w-100 shr" alt="..." height="520px" />
          </div>
          <div className="carousel-item">
            <img src="./images/pag2.gif" className="d-block w-100 shr" alt="..." height="520px" />
          </div>
          <div className="carousel-item">
            <img src="./images/pag3.gif" className="d-block w-100 shr" alt="..." height="520px" />
          </div>
          <div className="carousel-item">
            <img src="./images/pag4.gif" className="d-block w-100 shr" alt="..." height="520px" />
          </div>
          <div className="carousel-item">
            <img src="./images/pag5.gif" className="d-block w-100 shr" alt="..." height="520px" />
          </div>
          <div className="carousel-item">
            <img src="./images/pag6.gif" className="d-block w-100 shr" alt="..." height="520px" />
          </div>
        </div>
        <button className="carousel-control-prev" type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide="prev">
          <span className="carousel-control-prev-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Previous</span>
        </button>
        <button className="carousel-control-next" type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide="next">
          <span className="carousel-control-next-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Next</span>
        </button>
      </div>

      <h1 id="#about" className="title">
        Why ProofMint ?
      </h1>

      <div id="carouselExampleIndicators2" className="carousel slide" data-bs-ride="carousel">
        <div className="carousel-indicators">
          <button
            type="button"
            data-bs-target="#carouselExampleIndicators"
            data-bs-slide-to="0"
            className="active"
            aria-current="true"
            aria-label="Slide 1"
          ></button>
          <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="1" aria-label="Slide 2"></button>
          <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="2" aria-label="Slide 3"></button>
          <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="3" aria-label="Slide 4"></button>
          <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="4" aria-label="Slide 5"></button>
          <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="5" aria-label="Slide 6"></button>
        </div>
        <div className="carousel-inner">
          <div className="carousel-item active">
            <img src="./images/How NFTiers Work  (1).gif" className="d-block w-100 shr" alt="..." height="520px" />
          </div>
          <div className="carousel-item">
            <img src="./images/How NFTiers Work  (2).gif" className="d-block w-100 shr" alt="..." height="520px" />
          </div>
          <div className="carousel-item">
            <img src="./images/How NFTiers Work  (3).gif" className="d-block w-100 shr" alt="..." height="520px" />
          </div>
          <div className="carousel-item">
            <img src="./images/How NFTiers Work  (4).gif" className="d-block w-100 shr" alt="..." height="520px" />
          </div>
          <div className="carousel-item">
            <img src="./images/How NFTiers Work  (5).gif" className="d-block w-100 shr" alt="..." height="520px" />
          </div>
          <div className="carousel-item">
            <img src="./images/How NFTiers Work  (6).gif" className="d-block w-100 shr" alt="..." height="520px" />
          </div>
        </div>
        <button className="carousel-control-prev" type="button" data-bs-target="#carouselExampleIndicators2" data-bs-slide="prev">
          <span className="carousel-control-prev-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Previous</span>
        </button>
        <button className="carousel-control-next" type="button" data-bs-target="#carouselExampleIndicators2" data-bs-slide="next">
          <span className="carousel-control-next-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Next</span>
        </button>
      </div>
    </>
  );
};
