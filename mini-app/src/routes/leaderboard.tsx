import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/leaderboard')({
  component: LeaderboardPage
})

function LeaderboardPage () {
  const leaderboardData = useQuery(api.entity.leaderboard.getLeaderboard)

  return (
    <div className='container mx-auto py-10'>
      <div className='flex justify-between items-center mb-4'>
        <h1 className='text-3xl font-bold'>Leaderboard</h1>
        <Link to='/'>
          <Button variant='outline'>Back to Canvas</Button>
        </Link>
      </div>
      <div className='border rounded-md'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[100px]'>Rank</TableHead>
              <TableHead>User</TableHead>
              <TableHead className='text-right'>Pixels Placed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaderboardData ? (
              leaderboardData.map((entry, index) => (
                <TableRow key={entry.userId}>
                  <TableCell className='font-medium'>{index + 1}</TableCell>
                  <TableCell>{entry.username}</TableCell>
                  <TableCell className='text-right'>
                    {entry.pixelCount}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className='text-center h-24'>
                  Loading leaderboard...
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
