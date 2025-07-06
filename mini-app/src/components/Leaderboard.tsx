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
import { DrawerHeader, DrawerTitle } from './ui/drawer'

export function Leaderboard () {
  const leaderboardData = useQuery(api.entity.leaderboard.getLeaderboard)

  return (
    <div className='flex flex-col h-full'>
      <DrawerHeader>
        <DrawerTitle>Leaderboard</DrawerTitle>
      </DrawerHeader>
      <div className='flex-1 overflow-y-auto px-4'>
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
                    <TableCell className='max-w-[120px] truncate'>
                      {entry.username}
                    </TableCell>
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
    </div>
  )
}
