export const loginTextsMock = {
  meta: {
    next_page: null,
    previous_page: null,
    count: 1
  },
  data: [
    {
      slug: "mod_login",
      name: "mod_login",
      published: "2025-09-01T20:30:55.990516Z",
      updated: "2025-09-23T14:08:24.645448Z",
      scheduled: null,
      status: "published",
      page_type: "mod_login",
      fields: {
        partner: {
          meta: {
            id: 802095
          },
          code: "LM",
          name: "Lifemiles",
          description: "Lifemiles Description",
          status: true
        },
        title: "<p>Log-in or join Lifemiles</p>",
        email_place_holder: "Correo electrónico, usuario o número lifemiles",
        password_place_holder: "Contraseña",
        password_show_icon: "https://d296xu67oj0g2g.cloudfront.net/lm_cms/images/CMS/VARIOS/AV/open-eye.svg",
        password_hide_icon: "https://d296xu67oj0g2g.cloudfront.net/lm_cms/images/CMS/VARIOS/AV/closed-eye.svg",
        button_style: {
          meta: {
            id: 1017103
          },
          id: "LM-default-button-black",
          backgroundcolor: "#000000",
          backgroundcolor_hover: "#494949",
          backgroundcolor_active: "#6C6C6C",
          bordercolor: "#000000",
          border_color_hover: "#494949",
          border_color_active: "#6C6C6C",
          textcolor: "#FFFFFF",
          textcolor_active: "#FFFFFF",
          textcolor_hover: "#FFFFFF",
          "text-decoration-color": "",
          text_decoration: "",
          roundcorner: "4px",
          width: "234px",
          height: "63.056px",
          font_weight: "500",
          font_weight_hover: "500",
          font_size: "24px",
          padding: "",
          margin: ""
        },
        button_label: "Login",
        forget_password:
          '<p>Forgot your <a href="https://www.uat-lifemiles.net/reset-lmnumber" rel="follow">Lifemiles number</a> or <a href="https://www.uat-lifemiles.net/reset-password" rel="follow"> password</a>?</p>',
        create_account:
          '<p>Not yet a member? <a href="https://www.uat-lifemiles.net/creatucuenta/datos-personales" rel="follow">Register here for free</a></p>',
        link_color: "#177f8c",
        separator: "Or log-in with",
        providers: [
          {
            id: "google",
            provider_name: "Google",
            logo: "https://d296xu67oj0g2g.cloudfront.net/lm_cms/images/CMS/VARIOS/AV/google-logo.svg",
            logo_white: "https://d296xu67oj0g2g.cloudfront.net/lm_cms/images/CMS/VARIOS/AV/googleWhite.svg",
            button_style: {
              meta: {
                id: 1024627
              },
              id: "LM-default-button-white-black-text",
              backgroundcolor: "#FFFFFF",
              backgroundcolor_hover: "#FFFFFF",
              backgroundcolor_active: "#FFFFFF",
              bordercolor: "#FFFFFF",
              border_color_hover: "#FFFFFF",
              border_color_active: "#FFFFFF",
              textcolor: "#000000",
              textcolor_active: "#6C6C6C",
              textcolor_hover: "#494949",
              "text-decoration-color": "",
              text_decoration: "",
              roundcorner: "4px",
              width: "234px",
              height: "63.056px",
              font_weight: "500",
              font_weight_hover: "500",
              font_size: "24px",
              padding: "",
              margin: ""
            }
          },
          {
            id: "apple",
            provider_name: "Apple",
            logo: "https://d296xu67oj0g2g.cloudfront.net/lm_cms/images/CMS/VARIOS/AV/apple-logo.svg",
            logo_white: "https://d296xu67oj0g2g.cloudfront.net/lm_cms/images/CMS/VARIOS/AV/appleWhite.png",
            button_style: {
              meta: {
                id: 1024627
              },
              id: "LM-default-button-white-black-text",
              backgroundcolor: "#FFFFFF",
              backgroundcolor_hover: "#FFFFFF",
              backgroundcolor_active: "#FFFFFF",
              bordercolor: "#FFFFFF",
              border_color_hover: "#FFFFFF",
              border_color_active: "#FFFFFF",
              textcolor: "#000000",
              textcolor_active: "#6C6C6C",
              textcolor_hover: "#494949",
              "text-decoration-color": "",
              text_decoration: "",
              roundcorner: "4px",
              width: "234px",
              height: "63.056px",
              font_weight: "500",
              font_weight_hover: "500",
              font_size: "24px",
              padding: "",
              margin: ""
            }
          }
        ],
        props_header: {
          languageicon: "https://cdn.buttercms.com/7XmxRcvxSyutTtADkaF4",
          logoav: "https://d296xu67oj0g2g.cloudfront.net/lm_cms/images/CMS/AVMODULES/BASIC-HEADER/logoAvianca2.svg",
          logolm: "https://cdn.buttercms.com/p0NoSmxSRDXYqpOqQ1QR"
        },
        props_footer: {
          copytext: "Copyright © Lifemiles <:year>",
          logofooter: "https://d296xu67oj0g2g.cloudfront.net/lm_cms/images/CMS/AVMODULES/BASIC-FOOTER/logoStarMember.svg",
          staralliancelink: "https://www.staralliance.com/en/home"
        },
        fields: [
          {
            label: "Lifemiles email, username or number ",
            id: "username",
            defaultvalue: "",
            required: true,
            disabled: false,
            icon_error: "https://cdn.buttercms.com/dk61feDuSNj7E1jbmriR",
            size: "",
            format: "^[0-9]{11}$|^[A-Za-z0-9]{1,21}$|^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$",
            placeholder: "Lifemiles email, username or number ",
            type: "text",
            requirederror: "Enter a Lifemiles number, username or email",
            regexerror: "Enter a valid Lifemiles number, username or email"
          },
          {
            label: "Password",
            id: "password",
            defaultvalue: "",
            required: true,
            disabled: false,
            icon_error: "https://cdn.buttercms.com/dk61feDuSNj7E1jbmriR",
            size: "",
            format: "^((?=.*[a-z])(?=.*[A-Z])(?=.*[\\d])[a-zA-Z0-9,\\.:;_@-\\\\'\\+=\\(\\)\\*\\/\\<\\>\\#$%&\\¿?]{8,16})$",
            placeholder: "Password",
            type: "password",
            requirederror: "Enter your password",
            regexerror: "Enter a valid password"
          }
        ],
        alertdesign: {
          id: "error",
          background_color: "#FFF3E0",
          icon_color: "#88431C",
          text_color: "#88431C"
        },
        modal_error_design: {
          id: "error",
          buttonstyle: {
            meta: {
              id: 1017103
            },
            id: "LM-default-button-black",
            backgroundcolor: "#000000",
            backgroundcolor_hover: "#494949",
            backgroundcolor_active: "#6C6C6C",
            bordercolor: "#000000",
            border_color_hover: "#494949",
            border_color_active: "#6C6C6C",
            textcolor: "#FFFFFF",
            textcolor_active: "#FFFFFF",
            textcolor_hover: "#FFFFFF",
            "text-decoration-color": "",
            text_decoration: "",
            roundcorner: "4px",
            width: "234px",
            height: "63.056px",
            font_weight: "500",
            font_weight_hover: "500",
            font_size: "24px",
            padding: "",
            margin: ""
          }
        }
      }
    }
  ]
}
