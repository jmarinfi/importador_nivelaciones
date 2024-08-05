const Spinner = () => {
  return (
    <>
      <div className="container d-flex justify-content-around">
        <div
          className="spinner-grow"
          style={{ width: '6rem', height: '6rem' }}
          role="status"
        ></div>
        <div
          className="spinner-grow"
          style={{ width: '6rem', height: '6rem' }}
          role="status"
        ></div>
        <div
          className="spinner-grow"
          style={{ width: '6rem', height: '6rem' }}
          role="status"
        ></div>
      </div>
    </>
  )
}

export default Spinner