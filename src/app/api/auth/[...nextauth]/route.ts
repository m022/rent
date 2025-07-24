import NextAuth from 'next-auth'
import KakaoProvider from 'next-auth/providers/kakao'
import NaverProvider from 'next-auth/providers/naver';
import CredentialsProvider from 'next-auth/providers/credentials'
import { signJwtAccessToken } from '@/app/lib/jwt';

const handler = NextAuth({
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
                //console.log('$$$ user: ', user)

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
            //console.log('$$$ signIn user: ', user)
            //console.log('$$$ signIn account: ', account)
            //console.log('$$$ signIn profile: ', profile)
            //console.log('$$$ signIn email: ', email)
            //console.log('$$$ signIn credentials: ', credentials)

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

                const newuser = await res.json()
                // 토큰 생성 
                const accessToken = signJwtAccessToken(newuser);
                user = {
                    ...newuser,
                    accessToken,
                };

                //console.log('$$$ signin oauth user: ', user)
            }
            
            return true;
        },
        async redirect({ url, baseUrl }) {
            // Allows relative callback URLs
            if (url.startsWith("/")) return `${baseUrl}${url}`
            // Allows callback URLs on the same origin
            else if (new URL(url).origin === baseUrl) return url
            return baseUrl
        },      
        // token 정보와 user 정보를 하나의 object로 return
        async jwt({ token, user }) {
            console.log('$$$ callbacks jwt token: ', token)
            console.log('$$$ callbacks jwt user: ', token)
             // 리턴되는 값들은 token에 저장된다.
            return { ...token, ...user};
        },
        async session({ session, token }) {
            console.log('$$$ token: ', token)
            session.user = token as any;
            console.log('$$$ session: ', session)
            return session;
        },
    },
});

export { handler as GET, handler as POST };