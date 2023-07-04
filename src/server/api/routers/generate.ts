import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { Configuration, OpenAIApi } from "openai"
import AWS from "aws-sdk"
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc"
import { env } from "~/env.mjs"
import { b64Image } from "~/data/b64Image"

const s3 = new AWS.S3({
  credentials: {
    accessKeyId: env.ACCESS_KEY_ID,
    secretAccessKey: env.SECRET_ACCESS_KEY,
  },
  region: "us-east-1",
})

const BUCKET_NAME = "tevo-icon-generator"

const configuration = new Configuration({
  apiKey: env.DALLE_API_KEY,
})
const openai = new OpenAIApi(configuration)

async function generateIcon(prompt: string, numberOfIcons = 1): Promise<string[]> {
  if (env.MOCK_DALLE === "true") {
    return new Array<string>(numberOfIcons).fill(b64Image)
  } else {
    const response = await openai.createImage({
      prompt,
      n: numberOfIcons,
      size: "512x512",
      response_format: "b64_json",
    })
    return response.data.data.map((result) => result.b64_json || "")
  }
}

export const generateRouter = createTRPCRouter({
  generateIcon: protectedProcedure
    .input(z.object({ prompt: z.string() }))
    .mutation(async ({ ctx, input }) => {

      const { count } = await ctx.prisma.user.updateMany({
        where: {
          id: ctx.session.user.id,
          credits: {
            gte: 1,
          },
        },
        data: {
          credits: {
            decrement: 1,
          },
        },
      })

      if (count <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "you do not have enough credits",
        })
      }

      const response = await generateIcon(input.prompt)

      const image = response[0]

      if(!image) {
        return
      }

      const icon = await ctx.prisma.icon.create({
        data: {
          prompt: input.prompt,
          userId: ctx.session.user.id
        }
      })

      console.log({ icon })

      // await s3
      //       .putObject({
      //         Bucket: BUCKET_NAME,
      //         Body: Buffer.from(image, "base64"),
      //         Key: icon.id,
      //         ContentEncoding: "base64",
      //         ContentType: "image/png",
      //       })
      //       .promise();

      return {
        imageUrl: `https://${BUCKET_NAME}.s3.amazonaws.com/${icon.id}`,
      }
    }),
})
