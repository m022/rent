//app/api/user/route.ts

import prisma from '@/app/lib/prismadb'
import * as bcrypt from 'bcrypt'

interface RequestBody {
  type: string;
  name: string;
  email: string;
  password: string;
  profile: string;
}

export async function POST(request: Request) {
  const body: RequestBody = await request.json()

  let user = await prisma.user.findUnique({
    where: {
      // 입력받은 email 과 테이블 email 컬럼 값이 같은 데이터 추출
      email: body.email,      
    }
  })

  if (user) {

      if (body.type && body.type === 'oauth') {
        await prisma.user.update({ 
          where: {
            id: user.id,
          },
          data: {
            updated_at: new Date(),
          }
        })
      }
  }
  else {
    user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: (body.type) ? body.type : await bcrypt.hash(body.password, 10),
        profile: body.profile,
      },
    })
  }

  // user 객체에서 password 값은 제외
  const { password, ...result } = user
  return new Response(JSON.stringify(result))
}