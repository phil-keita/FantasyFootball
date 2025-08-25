import { useDraftStore, Player } from '../store/draftStore'

interface DraftPickCardProps {
  pick: {
    round: number
    pickNumber: number
    teamId: string
    player: Player | null
    isUser: boolean
  }
}

export const DraftPickCard = ({ pick }: DraftPickCardProps) => {
  const { teams, currentPick } = useDraftStore()
  const team = teams.find(t => t.id === pick.teamId)
  const isCurrentPick = currentPick.round === pick.round && currentPick.pickNumber === pick.pickNumber

  return (
    <div className={`
      p-3 rounded-lg border-2 transition-all duration-200
      ${isCurrentPick 
        ? 'border-blue-500 bg-blue-50 shadow-md' 
        : 'border-gray-200 bg-white hover:bg-gray-50'
      }
      ${pick.isUser ? 'ring-2 ring-green-200' : ''}
    `}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-medium text-gray-600">
          {pick.round}.{pick.pickNumber}
        </span>
        <span className="text-xs text-gray-500">
          {team?.name}
        </span>
      </div>
      
      {pick.player ? (
        <div>
          <div className="font-semibold text-gray-900">
            {pick.player.name}
          </div>
          <div className="text-sm text-gray-600">
            {pick.player.position} - {pick.player.team}
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          {isCurrentPick ? (
            <div className="text-blue-600 font-medium">
              {pick.isUser ? 'Your Pick!' : 'On the Clock'}
            </div>
          ) : (
            <div className="text-gray-400 text-sm">
              Available
            </div>
          )}
        </div>
      )}
    </div>
  )
}
