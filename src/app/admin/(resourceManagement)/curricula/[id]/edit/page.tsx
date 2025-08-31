import EditCurriculumClient from './edit-curriculum-client'
// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic';


export default async function EditCurriculumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  return <EditCurriculumClient curriculumId={id} />
}
