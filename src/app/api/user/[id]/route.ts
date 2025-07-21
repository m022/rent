//app/api/user/[id]/route.ts

import prisma from '@/app/lib/prismadb'

export async function GET(
    request: Request, 
    context : { params: { id: string }},
) {
    const params = await context.params

    console.log(params)

    // 테이블에서 id 값은 Int 로 정의되어 있기 때문에 형변환
    const id = Number(params.id)

    const userPosts = await prisma.post.findMany({
        where: {
            authorId: id,
        },
        include: {
            author: {
                select: {
                    email: true,
                    name: true,
                }
            }
        }
    })
    return new Response(JSON.stringify(userPosts))
}