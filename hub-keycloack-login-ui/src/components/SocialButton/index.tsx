import { LoginFields } from "types/models/loginTexts"
//Styles
import styles from "./main.module.css"

interface SocialButtonProps {
  providers?: Provider[]
  texts: LoginFields | undefined
}

export interface Provider {
  alias: string
  displayName: string
  url: string
}

function SocialButton(props: SocialButtonProps) {
  function render() {
    const { texts, providers } = props
    return (
      <div className={styles.socialButtons}>
        {texts?.providers?.map((item, key) => {
          const keycloackProvider = providers?.find((provider: Provider) => provider.alias === item?.id)

          return (
            keycloackProvider && (
              <a
                data-cy={`${item?.id}Button`}
                data-testid={`${item?.id}Button`}
                key={key}
                className={styles.buttons}
                onClick={() => (window.location.href = keycloackProvider.url)}
              >
                <div className={styles.socialIcon}>
                  <img className={styles.icon} src={item?.logo} alt={`${item?.id} icon`} />
                  <img className={styles.iconWhite} src={item?.logo_white} alt={`${item?.id} icon white`} />
                  <span>{item?.provider_name}</span>
                </div>
              </a>
            )
          )
        })}
      </div>
    )
  }

  return render()
}

export default SocialButton
