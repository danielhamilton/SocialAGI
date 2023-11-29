import { ChatMessage, CortexStep, instruction, internalMonologue } from "socialagi/next";
import { MemoryStream } from "..";
import { html } from "common-tags";

interface WorkingMemoryContructorArgs {
  step?: CortexStep
  // stream: MemoryStream
}

export class WorkingMemory {
  // step: CortexStep<any>
  stream: MemoryStream

  narrative: string = ""

  constructor({ step }: WorkingMemoryContructorArgs) {
    this.stream = new MemoryStream()
  }

  async addMemory(step: CortexStep, newMemories: ChatMessage[]) {
    await Promise.all(newMemories.map((memory) => {
      return this.stream.store({
        content: memory.content,
        metadata: {
          role: memory.role,
          name: memory.name,
        }
      })
    }))

    const paragraph = await step.next(instruction(html`
      ${step.entityName} is keeping a running summary of what's happening now both in her mind and in her interactions.
      Here is ${step.entityName}'s current narrative:
      ## Narrative
      ${this.narrative || "No narrative yet."}

      Please update or create a paragraph describing both ${step.entityName}'s innner world and what they are doing and interacting with.
      This paragraph should make sure to retain any important information in the context of her current setting, goal, and interaction.
      The paragraph should *not* include any fabricated details and should only include real memories from the existing narrative and the conversation history.
      ${step.entityName} summarizes their current narrative as follows:
    `.trim()))

    this.narrative = paragraph.value
    console.debug("narrative: ", this.narrative)
  }
}