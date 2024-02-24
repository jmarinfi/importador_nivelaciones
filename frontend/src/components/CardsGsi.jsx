import PropTypes from 'prop-types'


const Card = ({ header, data, unit, additionalClass }) => {
  return (
    <>
      <div className={`card text-white m-3 ${additionalClass}`}>
        <div className={'card-header'}>{header}</div>
        <div className={'card-body'}>
          <p className={'card-text'}>{`${data} ${unit}`}</p>
        </div>
      </div>
    </>
  )
}

Card.propTypes = {
  header: PropTypes.string.isRequired,
  data: PropTypes.number.isRequired,
  unit: PropTypes.string.isRequired,
  additionalClass: PropTypes.string
}

const CardsGroup = ({ cards }) => {
  return (
    <>
      <div className={'card-group'}>
        {cards.map((card, index) => (
          <Card key={`card_${index}`} header={card.header} data={Number(card.data)} unit={card.unit} text={card.text} additionalClass={card.additionalClass} />
        ))}
      </div>
    </>
  )
}

CardsGroup.propTypes = {
  cards: PropTypes.array.isRequired
}


export default CardsGroup