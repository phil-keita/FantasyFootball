import { useDraftStore, Player } from '../store/draftStore'

interface TeamRosterProps {
  teamId: string
}

export const TeamRoster = ({ teamId }: TeamRosterProps) => {
  const { teams, draftBoard } = useDraftStore()
  const team = teams.find(t => t.id === teamId)
  
  // Get all picks for this team
  const teamPicks = draftBoard
    .flat()
    .filter(pick => pick.teamId === teamId && pick.player)
    .map(pick => pick.player!)

  // Organize by position
  const rosterByPosition = teamPicks.reduce((acc, player) => {
    const pos = player.position
    if (!acc[pos]) acc[pos] = []
    acc[pos].push(player)
    return acc
  }, {} as Record<string, Player[]>)

  const positionOrder = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF']

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-bold text-lg mb-3 text-gray-900">
        {team?.name || 'Unknown Team'}
      </h3>
      
      {positionOrder.map(position => {
        const players = rosterByPosition[position] || []
        return (
          <div key={position} className="mb-3">
            <h4 className="font-semibold text-sm text-gray-700 mb-1">
              {position} ({players.length})
            </h4>
            {players.length > 0 ? (
              <div className="space-y-1">
                {players.map((player, idx) => (
                  <div key={idx} className="text-sm text-gray-600 pl-2">
                    {player.name} ({player.team})
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-400 pl-2 italic">
                No {position} selected
              </div>
            )}
          </div>
        )
      })}
      
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="text-sm text-gray-500">
          Total: {teamPicks.length} players
        </div>
      </div>
    </div>
  )
}
