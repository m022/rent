//app/api/signin/route.ts

import prisma from '@/app/lib/prismadb'
import * as bcrypt from 'bcrypt'
import { signJwtAccessToken } from '@/app/lib/jwt';

interface RequestBody {
  username: string;
  password: string;
}

export async function POST(request: Request) {
  const body: RequestBody = await request.json()

  const user = await prisma.user.findFirst({
    where: {
      // 입력받은 username 과 테이블 email 컬럼 값이 같은 데이터 추출
      email: body.username,
    },
  })

  // 패스워드도 동일한지 확인
  if (user && (await bcrypt.compare(body.password, user.password))) {
    const { password, ...userWithoutPass } = user

    // 토큰 생성 
    const accessToken = signJwtAccessToken(userWithoutPass);
    const result = {
        ...userWithoutPass,
        accessToken,
    };

    return new Response(JSON.stringify(result))
  } else return new Response(JSON.stringify(null))
}