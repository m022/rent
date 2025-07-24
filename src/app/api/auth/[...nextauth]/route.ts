import NextAuth from 'next-auth'
import KakaoProvider from 'next-auth/providers/kakao'
import NaverProvider from 'next-auth/providers/naver';
import CredentialsProvider from 'next-auth/providers/credentials'
import { signJwtAccessToken } from '@/app/lib/jwt';

export const authOptions: any = {
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
        KakaoProvider({
            clientId: process.env.KAKAO_OAUTH_ID || '',
            clientSecret: process.env.KAKAO_OAUTH_SECRET || '',
        }),
        NaverProvider({
            clientId: process.env.NAVER_OAUTH_ID || '',
            clientSecret: process.env.NAVER_OAUTH_SECRET || '',
        }),
        // ID, PW 로그인 방식
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                username: { label: '이메일', type: 'text', placeholder: '이메일 주소를 입력해 주세요.' },
                password: { label: '비밀번호', type: 'password' },
            },

            async authorize(credentials, req) {
                const res = await fetch(`${process.env.NEXTAUTH_URL}/api/signin`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: credentials?.username,
                        password: credentials?.password,
                    }),
                })
                const user = await res.json()
                console.log('$$$ user: ', user)

                if (user) {
                    // Any object returned will be saved in `user` property of the JWT
                    return user
                } else {
                    // If you return null then an error will be displayed advising the user to check their details.
                    return null

                    // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
                }

            },
         
        }),        
    ],
    callbacks:{ 
        async signIn({ user, account, profile, email, credentials }: any) {
            //console.log('$$$[callbacks signin] user: ', user)
            //console.log('$$$[callbacks signin] account: ', account)
            //console.log('$$$[callbacks signin] profile: ', profile)
            //console.log('$$$[callbacks signin] email: ', email)
            //console.log('$$$[callbacks signin] credentials: ', credentials)

            if (account.type === "oauth") {
                const res = await fetch(`${process.env.NEXTAUTH_URL}/api/user`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type: account.type,
                        name: user?.name,
                        email: account.provider +"_"+ user?.id,
                        //password: '',
                        profile: user?.image,                      
                    }),
                })

                user = await res.json()
                console.log('$$$[callbacks signin] oauth user: ', user)
            }
            
            // 토큰 생성 
            // const accessToken = signJwtAccessToken(user);
            // user = {
            //     ...user,
            //     accessToken,
            // };    

            console.log('$$$[callbacks signin] user: ', user)
            
            return true;
        },
        async redirect({ url, baseUrl }: any) {
            // Allows relative callback URLs
            if (url.startsWith("/")) return `${baseUrl}${url}`
            // Allows callback URLs on the same origin
            else if (new URL(url).origin === baseUrl) return url
            return baseUrl
        }, 
        async session({ session, user, token }: any) {
            console.log('$$$[callbacks session] token: ', token)
            session.user = token as any;
            console.log('$$$[callbacks session] session: ', session)
            return session;
        },            
        // token 정보와 user 정보를 하나의 object로 return
        async jwt({ token, user, account, profile, trigger, isNewUser }: any) {
            console.log('$$$[callbacks jwt] token: ', token)
            console.log('$$$[callbacks jwt] user: ', user)
            console.log('$$$[callbacks jwt] account: ', account)
            console.log('$$$[callbacks jwt] profile: ', profile)
            console.log('$$$[callbacks jwt] trigger: ', trigger)
             // 리턴되는 값들은 token에 저장된다.
            return { ...token, ...user};
            //return token;
        },
    },
    session: {
        strategy: "jwt",// 세션을 JWT 방식으로 관리
        maxAge: 60 * 60 * 24 * 1,//세션만료기간 설정
    },
    debug: true, //콘솔에 디버그 정보 출력 활성화  
    cookies: {
        sessionToken: {
            name: `session-token`,// 세션토큰 쿠키이름설정
            options: {
                httpOnly: true, //자바스크립트를 통한 쿠키 접근을 방지하여 XSS 공격으로부터 보호
                sameSite: "lax", //CSRF 공격을 방지하고 일부 크로스 사이트 요청을 허용
                path: "/", //쿠키가 전체 사이트에서 유효하도록 설정
                secure: process.env.NODE_ENV === "production",
                maxAge: 60 * 60 * 24 * 1, //1일
            },
        },
    },    
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST };