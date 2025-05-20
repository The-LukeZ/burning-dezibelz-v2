export async function GET({ locals }) {
  console.log("Google auth callback");
  return new Response();
}
