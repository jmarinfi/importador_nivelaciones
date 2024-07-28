
const CardsGsi = ({ cards }) => {
  return (
    <div className="card-group mb-3">
      {cards.map((card) => {
        return (
          <div key={card.header.replace(' ', '')} className={`card ${card.additionalClass}`}>
            <div className="card-header"><h5>{card.header}</h5></div>
            <div className="card-body">
              <p className="card-text">{`${card.data} ${card.unit}`}</p>
            </div>
          </div>
        )
      })}
    </div>

  )
}

export default CardsGsi