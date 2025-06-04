import { UiStrategyControlConfig, UiStrategyOption } from './models'

export const createOption = (
  value: string,
  text: string
): UiStrategyOption => ({
  value,
  text
})

const createSelectElement = (
  id: string,
  options: readonly UiStrategyOption[]
): HTMLSelectElement => {
  const select = document.createElement('select')
  select.id = id

  options.forEach(({ value, text }) => {
    const option = document.createElement('option')
    option.value = value
    option.textContent = text
    select.appendChild(option)
  })

  return select
}

const createLabel = (text: string, htmlFor: string): HTMLLabelElement => {
  const label = document.createElement('label')
  label.textContent = text
  label.htmlFor = htmlFor
  return label
}

export const createControl = (
  id: string,
  config: UiStrategyControlConfig,
  currentValue: string,
  onChange: (value: string) => void
): HTMLDivElement => {
  const container = document.createElement('div')
  const label = createLabel(config.label, id)
  const select = createSelectElement(id, config.options)

  select.value = currentValue
  select.addEventListener('change', (e) =>
    onChange((e.target as HTMLSelectElement).value)
  )

  container.append(label, select)
  return container
}
