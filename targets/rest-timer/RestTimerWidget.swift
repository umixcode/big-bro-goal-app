import ActivityKit
import WidgetKit
import SwiftUI

// MUST exactly match the RestTimerAttributes struct in the
// modules/rest-activity native module — ActivityKit serializes state
// between the app and this widget extension process via this shape.
struct RestTimerAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var endAt: Date
    }
    var exerciseName: String
}

@ViewBuilder
private func countdownText(endAt: Date) -> some View {
    if endAt > Date.now {
        Text(timerInterval: Date.now...endAt, countsDown: true, showsHours: false)
    } else {
        Text("0:00")
    }
}

struct RestTimerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: RestTimerAttributes.self) { context in
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("REST")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    Text(context.attributes.exerciseName)
                        .font(.headline)
                        .lineLimit(1)
                }
                Spacer()
                countdownText(endAt: context.state.endAt)
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .foregroundStyle(Color.accentColor)
            }
            .padding()
            .activityBackgroundTint(Color.black)
            .activitySystemActionForegroundColor(Color.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Text(context.attributes.exerciseName)
                        .font(.caption)
                        .lineLimit(1)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    countdownText(endAt: context.state.endAt)
                        .font(.title3)
                        .monospacedDigit()
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("Rest")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            } compactLeading: {
                Image(systemName: "timer")
            } compactTrailing: {
                countdownText(endAt: context.state.endAt)
                    .font(.caption2)
                    .monospacedDigit()
                    .frame(width: 40)
            } minimal: {
                Image(systemName: "timer")
            }
        }
    }
}

@main
struct RestTimerWidgetBundle: WidgetBundle {
    var body: some Widget {
        RestTimerLiveActivity()
    }
}
