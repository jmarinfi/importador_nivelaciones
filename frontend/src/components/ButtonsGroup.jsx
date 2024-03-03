
const Button = ({ text, classes, eventOnClick }) => {
  return (
    <button className={classes} type={'button'} onClick={eventOnClick}>
      {text}
    </button>
  )
}

const ButtonsGroup = ({ buttons }) => {
  return (
    <div className={'d-grid gap-2'} role={'group'}>
      <div className={'btn-group m-3'}>
        {buttons.map((button, index) => (
          <Button key={`button_${index}`} text={button.text} classes={button.classes} eventOnClick={button.eventOnClick}/>
        ))}
      </div>
    </div>
  )
}

export default ButtonsGroup